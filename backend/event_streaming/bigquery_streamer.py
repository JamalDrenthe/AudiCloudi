"""
CloudiAudi BigQuery Telemetry Ingestion Pipeline.
Handles real-time event streaming directly to Google BigQuery and Firestore.
Enables offline matrix factorization (iALS) and large-scale analytical processing.
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional
from google.cloud import bigquery
from google.cloud.firestore import Client as FirestoreClient
from backend.core.config import get_firestore_client, settings
from backend.event_streaming.contracts import (
    AudioInteractionEvent,
    WaveformCommentEvent,
    MarketplaceEvent,
)


class BigQueryStreamer:
    """Streams ingestion events to BigQuery and mirrors to Firestore."""

    DATASET_ID = "cloudiaudi_analytics"
    TABLE_AUDIO = "audio_interactions"
    TABLE_COMMENTS = "waveform_comments"
    TABLE_MARKETPLACE = "marketplace_events"

    def __init__(self, bq_client: Optional[bigquery.Client] = None, firestore_client: Optional[FirestoreClient] = None):
        self.bq_client = bq_client
        self.db = firestore_client or get_firestore_client()

    def _get_bq_client(self) -> Optional[bigquery.Client]:
        if self.bq_client is None:
            try:
                self.bq_client = bigquery.Client(project=settings.PROJECT_ID)
            except Exception:
                self.bq_client = None
        return self.bq_client

    def stream_audio_interaction(self, event: AudioInteractionEvent) -> Dict[str, Any]:
        """Writes audio playback event to Firestore and BigQuery."""
        doc_data = event.model_dump()
        doc_data["created_at"] = int(time.time() * 1000)

        # 1. Write to Firestore subcollection under track
        track_ref = self.db.collection("tracks").document(event.track_id)
        interaction_ref = track_ref.collection("interactions").document()
        event_id = interaction_ref.id
        doc_data["interaction_id"] = event_id
        interaction_ref.set(doc_data)

        # Also log in global user interaction history
        user_history_ref = (
            self.db.collection("users")
            .document(event.user_id)
            .collection("session_interactions")
            .document(event_id)
        )
        user_history_ref.set(doc_data)

        # 2. Stream to BigQuery
        client = self._get_bq_client()
        if client:
            table_ref = f"{settings.PROJECT_ID}.{self.DATASET_ID}.{self.TABLE_AUDIO}"
            row = event.to_bigquery_row()
            row["event_id"] = event_id
            client.insert_rows_json(table_ref, [row])

        return {"status": "persisted", "event_id": event_id}

    def stream_waveform_comment(self, event: WaveformCommentEvent) -> Dict[str, Any]:
        """Writes waveform timestamped comment to Firestore and BigQuery."""
        doc_data = event.model_dump()
        comment_ref = self.db.collection("comments").document()
        comment_id = comment_ref.id
        doc_data["comment_id"] = comment_id
        comment_ref.set(doc_data)

        # Also store under track's waveform_comments subcollection
        self.db.collection("tracks").document(event.track_id).collection("waveform_comments").document(comment_id).set(doc_data)

        client = self._get_bq_client()
        if client:
            table_ref = f"{settings.PROJECT_ID}.{self.DATASET_ID}.{self.TABLE_COMMENTS}"
            row = event.to_bigquery_row()
            row["comment_id"] = comment_id
            client.insert_rows_json(table_ref, [row])

        return {"status": "persisted", "comment_id": comment_id}

    def stream_marketplace_event(self, event: MarketplaceEvent) -> Dict[str, Any]:
        """Writes beat marketplace conversion event to Firestore and BigQuery."""
        doc_data = event.model_dump()
        event_ref = self.db.collection("marketplace_events").document()
        event_id = event_ref.id
        doc_data["event_id"] = event_id
        event_ref.set(doc_data)

        # Update track commercial conversions
        track_ref = self.db.collection("tracks").document(event.track_id)
        track_ref.collection("marketplace_telemetry").document(event_id).set(doc_data)

        client = self._get_bq_client()
        if client:
            table_ref = f"{settings.PROJECT_ID}.{self.DATASET_ID}.{self.TABLE_MARKETPLACE}"
            row = event.to_bigquery_row()
            row["event_id"] = event_id
            client.insert_rows_json(table_ref, [row])

        return {"status": "persisted", "event_id": event_id}
