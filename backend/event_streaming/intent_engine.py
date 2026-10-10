"""
CloudiAudi Realtime Session Intent Engine.
Calculates session intent probabilities:
P(Intent) in {Streamer (Consumer), Curator (Social), Buyer (Artist/Licensee)}
and outputs dynamic contextual weights: w = [w_ret, w_soc, w_com].
"""

from __future__ import annotations

import math
import time
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from pydantic import BaseModel, Field
from google.cloud.firestore import Client as FirestoreClient
from backend.core.config import get_firestore_client


class SessionIntentOutput(BaseModel):
    dominant_intent: str = Field(description="streamer, curator, or buyer")
    probabilities: Dict[str, float] = Field(description="P(Intent)")
    scoring_weights: Dict[str, float] = Field(description="w_ret, w_soc, w_com normalized")


class RealtimeSessionIntentEngine:
    """
    Evaluates the user's trailing 10 interaction events to determine intent
    and tune the feed re-ranking weights dynamically.
    """

    # Calibrated Logistic Weights for [completed, early_skip, social, marketplace_preview, checkout, recency]
    BETA_STREAMER = np.array([2.8, -1.5, -0.4, -2.0, -3.5, 0.5], dtype=np.float64)
    ALPHA_STREAMER = 0.50

    BETA_CURATOR = np.array([-0.2, 0.8, 3.2, -0.5, -1.0, 0.8], dtype=np.float64)
    ALPHA_CURATOR = -0.20

    BETA_BUYER = np.array([-1.0, 0.5, -0.5, 3.5, 5.0, 1.2], dtype=np.float64)
    ALPHA_BUYER = -0.80

    def __init__(self, db: Optional[FirestoreClient] = None):
        self.db = db or get_firestore_client()
        # In-memory fast cache for recent session states
        self._session_cache: Dict[str, List[Dict[str, Any]]] = {}

    def record_event_in_session(self, user_id: str, event_data: Dict[str, Any]) -> None:
        """Appends event to the in-memory rolling window of 10 events."""
        if user_id not in self._session_cache:
            self._session_cache[user_id] = []
        self._session_cache[user_id].append(event_data)
        if len(self._session_cache[user_id]) > 10:
            self._session_cache[user_id].pop(0)

    def fetch_recent_interactions(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetches the last N interactions from cache or Firestore."""
        if user_id in self._session_cache and len(self._session_cache[user_id]) >= 3:
            return self._session_cache[user_id]

        events = []
        try:
            docs = (
                self.db.collection("users")
                .document(user_id)
                .collection("session_interactions")
                .order_by("created_at", direction="DESCENDING")
                .limit(limit)
                .stream()
            )
            for d in docs:
                events.append(d.to_dict())
            events.reverse()
        except Exception:
            events = []

        self._session_cache[user_id] = events
        return events

    def extract_session_features(self, events: List[Dict[str, Any]]) -> np.ndarray:
        """
        Maps a sequence of interaction events into the 6-dimensional feature vector:
        phi = [completion_rate, early_skips, social_actions, market_previews, checkouts, recency]
        """
        N = max(1, len(events))
        if len(events) == 0:
            # Default prior: 70% completed, 10% skips, 10% social, 10% market
            return np.array([0.70, 0.10, 0.10, 0.10, 0.0, 0.5], dtype=np.float64)

        completions = 0
        early_skips = 0
        social_actions = 0
        market_previews = 0
        checkouts = 0
        recency_sum = 0.0

        current_time = time.time() * 1000

        for idx, ev in enumerate(events):
            ev_type = ev.get("event_type", "")
            duration = ev.get("duration_listened_ms", 0)
            total = ev.get("track_total_ms", 1)
            ratio = duration / float(total) if total > 0 else 0.0
            is_completed = ev.get("completed", False) or ratio >= 0.80
            is_early_skip = (ev.get("skipped_at_ms") is not None and ev.get("skipped_at_ms") < 30000) or (
                duration < 30000 and not is_completed
            )

            if is_completed:
                completions += 1
            if is_early_skip:
                early_skips += 1

            if ev_type in ("comment", "repost", "like", "playlist_add"):
                social_actions += 1

            if ev_type in ("preview_license", "add_to_cart"):
                market_previews += 1

            if ev_type in ("checkout_start", "license_purchase"):
                checkouts += 1

            # Recency discount
            ev_time = ev.get("created_at", current_time)
            age_minutes = max(0.0, (current_time - ev_time) / 60000.0)
            recency_sum += math.exp(-0.1 * age_minutes)

        return np.array(
            [
                completions / float(N),
                early_skips / float(N),
                social_actions / float(N),
                market_previews / float(N),
                checkouts / float(N),
                recency_sum / float(N),
            ],
            dtype=np.float64,
        )

    def calculate_session_intent(self, user_id: str) -> SessionIntentOutput:
        """
        Computes calibrated probability distribution over {streamer, curator, buyer}
        and returns normalized multi-objective weights [w_ret, w_soc, w_com].
        """
        events = self.fetch_recent_interactions(user_id, limit=10)
        phi = self.extract_session_features(events)

        logit_streamer = float(np.dot(self.BETA_STREAMER, phi) + self.ALPHA_STREAMER)
        logit_curator = float(np.dot(self.BETA_CURATOR, phi) + self.ALPHA_CURATOR)
        logit_buyer = float(np.dot(self.BETA_BUYER, phi) + self.ALPHA_BUYER)

        # Softmax computation with numerical stability
        max_logit = max(logit_streamer, logit_curator, logit_buyer)
        exp_streamer = math.exp(logit_streamer - max_logit)
        exp_curator = math.exp(logit_curator - max_logit)
        exp_buyer = math.exp(logit_buyer - max_logit)
        sum_exp = exp_streamer + exp_curator + exp_buyer

        p_streamer = exp_streamer / sum_exp
        p_curator = exp_curator / sum_exp
        p_buyer = exp_buyer / sum_exp

        # Dynamic weight calibration:
        # Base floor ensures balanced feed experience (no term drops completely to 0)
        floor = 0.10
        raw_ret = floor + (1.0 - 3 * floor) * p_streamer
        raw_soc = floor + (1.0 - 3 * floor) * p_curator
        raw_com = floor + (1.0 - 3 * floor) * p_buyer
        total_raw = raw_ret + raw_soc + raw_com

        w_ret = float(round(raw_ret / total_raw, 4))
        w_soc = float(round(raw_soc / total_raw, 4))
        w_com = float(round(raw_com / total_raw, 4))

        # Determine dominant intent
        probs = {"streamer": p_streamer, "curator": p_curator, "buyer": p_buyer}
        dominant = max(probs, key=probs.get)

        return SessionIntentOutput(
            dominant_intent=dominant,
            probabilities={
                "streamer": float(round(p_streamer, 4)),
                "curator": float(round(p_curator, 4)),
                "buyer": float(round(p_buyer, 4)),
            },
            scoring_weights={
                "retention": w_ret,
                "social": w_soc,
                "commercial": w_com,
            },
        )
