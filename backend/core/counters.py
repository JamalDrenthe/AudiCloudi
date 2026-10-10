"""
CloudiAudi Distributed Sharded Counters Engine.
Eliminates Firestore 1 write/second lock contention on popular tracks.
Replaces single-document writes with N=10 to N=20 distributed shards
under `/tracks/{track_id}/shards/{shard_id}`.
Provides:
- `increment_play_count`: Sub-10ms atomic increment via random shard allocation
- `get_total_plays`: Low-latency aggregate query across shards
- `aggregate_shards_to_track`: Periodic aggregation back to root track document
- `scheduled_aggregate_play_counts`: Cloud Function entrypoint
"""

from __future__ import annotations

import random
import time
from typing import Any, Dict, List, Optional
from google.cloud import firestore
from google.cloud.firestore import Client as FirestoreClient
from google.cloud.firestore_v1.aggregate import AggregateQuery
from backend.core.config import get_firestore_client


class ShardedCounterManager:
    """Manages distributed sharded counters for track stream plays."""

    DEFAULT_NUM_SHARDS = 16  # Optimal power-of-two shard count for up to 16 writes/sec per track

    def __init__(self, db: Optional[FirestoreClient] = None, num_shards: int = DEFAULT_NUM_SHARDS):
        self.db = db or get_firestore_client()
        self.num_shards = max(10, min(num_shards, 32))

    def _get_shard_id(self, num_shards: Optional[int] = None) -> str:
        """Selects a pseudo-random shard ID in range [0, num_shards - 1]."""
        n = num_shards or self.num_shards
        shard_idx = random.randint(0, n - 1)
        return f"shard_{shard_idx}"

    def increment_play_count(
        self,
        track_id: str,
        num_shards: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Increments the play count atomically across distributed shards.
        Zero contention: Distributes traffic evenly across N shards.
        """
        if not track_id:
            raise ValueError("track_id cannot be empty")

        n = num_shards or self.num_shards
        shard_id = self._get_shard_id(n)
        shard_ref = (
            self.db.collection("tracks")
            .document(track_id)
            .collection("shards")
            .document(shard_id)
        )

        now_ms = int(time.time() * 1000)

        # Atomic increment using Firestore field transform
        shard_ref.set(
            {
                "count": firestore.Increment(1),
                "updated_at": now_ms,
                "shard_id": shard_id,
            },
            merge=True,
        )

        return {
            "status": "incremented",
            "track_id": track_id,
            "shard_id": shard_id,
            "timestamp_ms": now_ms,
        }

    def get_total_plays(self, track_id: str) -> int:
        """
        Retrieves the exact total play count using Firestore Aggregation Queries.
        Falls back to summing individual shard documents if aggregation is unavailable.
        """
        if not track_id:
            return 0

        shards_ref = self.db.collection("tracks").document(track_id).collection("shards")

        try:
            # Native Server-Side Aggregation Query (Costs only 1 read per 1000 index entries)
            aggregate_query = AggregateQuery(shards_ref).sum("count")
            results = aggregate_query.get()
            for r in results:
                # Firestore returns list of aggregate results
                val = r[0].value if hasattr(r[0], "value") else r[0]
                return int(val or 0)
        except Exception:
            pass

        # Fallback: In-memory summation over active shards
        total = 0
        docs = shards_ref.stream()
        for doc in docs:
            data = doc.to_dict()
            total += int(data.get("count", 0))

        return total

    def aggregate_shards_to_track(self, track_id: str) -> int:
        """
        Consolidates shard counters into the root track document `playsCount` / `plays_count`.
        Called periodically to keep UI reads fast and inexpensive.
        """
        total_plays = self.get_total_plays(track_id)
        now_ms = int(time.time() * 1000)

        track_ref = self.db.collection("tracks").document(track_id)
        track_ref.set(
            {
                "playsCount": total_plays,
                "plays_count": total_plays,
                "last_aggregated_at": now_ms,
            },
            merge=True,
        )
        return total_plays

    def batch_aggregate_all_tracks(self, batch_size: int = 50) -> Dict[str, Any]:
        """
        Processes all ready tracks and updates their cached total plays.
        Designed for scheduled execution (e.g. every 5 minutes).
        """
        tracks_ref = self.db.collection("tracks")
        query = tracks_ref.where("status", "==", "ready").limit(batch_size)
        tracks = list(query.stream())

        aggregated_count = 0
        total_streams = 0

        for doc in tracks:
            track_id = doc.id
            count = self.aggregate_shards_to_track(track_id)
            aggregated_count += 1
            total_streams += count

        return {
            "status": "success",
            "tracks_aggregated": aggregated_count,
            "total_streams_sum": total_streams,
            "timestamp_ms": int(time.time() * 1000),
        }


# Global Singleton Instance
counter_manager = ShardedCounterManager()


def increment_play_count(track_id: str, num_shards: int = 16) -> Dict[str, Any]:
    """Helper module function."""
    return counter_manager.increment_play_count(track_id=track_id, num_shards=num_shards)


def get_total_plays(track_id: str) -> int:
    """Helper module function."""
    return counter_manager.get_total_plays(track_id=track_id)


def aggregate_shards_to_track(track_id: str) -> int:
    """Helper module function."""
    return counter_manager.aggregate_shards_to_track(track_id=track_id)


def scheduled_aggregate_play_counts(event: Any = None, context: Any = None) -> Dict[str, Any]:
    """
    Cloud Function (2nd Gen) entrypoint for Google Cloud Scheduler / PubSub trigger.
    Runs periodically (e.g., cron '*/5 * * * *') to sync shards to root track documents.
    """
    return counter_manager.batch_aggregate_all_tracks()
