"""
CloudiAudi Contextual Multi-Armed Bandit (LinUCB) Engine.
Balances:
- 95% exploitation of user affinity and mature tracks
- 5% first-play exploration allocation for new cold-start uploads
State is persisted in Firestore.
"""

from __future__ import annotations

import random
import time
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from google.cloud.firestore import Client as FirestoreClient
from backend.core.config import get_firestore_client, settings


class LinUCBBandit:
    """
    Linear Upper Confidence Bound (LinUCB) algorithm with disjoint or shared linear models.
    Supports 95% exploit / 5% cold-start first-play exploration allocation.
    """

    DIM = 256  # Dimension of acoustic embedding & user affinity context vector
    ALPHA = 0.75  # Exploration bonus parameter

    def __init__(self, db: Optional[FirestoreClient] = None):
        self.db = db or get_firestore_client()
        # In-memory arm models: arm_id -> { "A_inv": np.ndarray, "b": np.ndarray, "count": int }
        self._arms: Dict[str, Dict[str, Any]] = {}

    def _get_arm_model(self, arm_id: str) -> Dict[str, Any]:
        """Loads arm state or initializes with Identity matrix and zero vector."""
        if arm_id in self._arms:
            return self._arms[arm_id]

        doc_ref = self.db.collection("bandit_arms").document(arm_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict() or {}
            # Flattened matrix serialization
            A_diag = data.get("A_diag")
            b_list = data.get("b")
            count = data.get("pull_count", 0)
            if A_diag and b_list and len(A_diag) == self.DIM and len(b_list) == self.DIM:
                # Diagonal regularized approximation for ultra-low latency inversion
                A_inv = np.diag(1.0 / (np.array(A_diag, dtype=np.float64) + 1.0))
                b = np.array(b_list, dtype=np.float64)
                model = {"A_diag": np.array(A_diag, dtype=np.float64), "A_inv": A_inv, "b": b, "count": count}
                self._arms[arm_id] = model
                return model

        # Default initialization: A = I, b = 0
        A_diag = np.ones(self.DIM, dtype=np.float64)
        A_inv = np.diag(np.ones(self.DIM, dtype=np.float64))
        b = np.zeros(self.DIM, dtype=np.float64)
        model = {"A_diag": A_diag, "A_inv": A_inv, "b": b, "count": 0}
        self._arms[arm_id] = model
        return model

    def calculate_ucb_score(self, arm_id: str, context_x: np.ndarray) -> float:
        """
        Calculates UCB score:
        UCB(a) = theta_a^T x + alpha * sqrt(x^T A_a^{-1} x)
        """
        model = self._get_arm_model(arm_id)
        A_inv = model["A_inv"]
        b = model["b"]

        theta = np.dot(A_inv, b)
        expected_reward = float(np.dot(theta, context_x))

        # Variance estimation
        variance = float(np.dot(context_x, np.dot(A_inv, context_x)))
        confidence_bound = self.ALPHA * np.sqrt(max(1e-6, variance))

        return float(expected_reward + confidence_bound)

    def select_tracks(
        self,
        candidate_pool: List[Dict[str, Any]],
        user_context_vector: List[float],
        top_k: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Selects top_k tracks executing the 95% exploit / 5% cold-start policy.
        """
        if not candidate_pool:
            return []

        x = np.array(user_context_vector, dtype=np.float64)
        norm_x = np.linalg.norm(x)
        if norm_x > 0:
            x = x / norm_x
        else:
            x = np.ones(self.DIM, dtype=np.float64) / np.sqrt(self.DIM)

        # Segregate mature vs cold-start tracks
        mature_candidates: List[Dict[str, Any]] = []
        cold_candidates: List[Dict[str, Any]] = []

        for item in candidate_pool:
            plays = item.get("plays_count", 0)
            is_cold = item.get("is_cold_start", True) or plays < 50
            if is_cold:
                cold_candidates.append(item)
            else:
                mature_candidates.append(item)

        # Score mature candidates with LinUCB
        for item in mature_candidates:
            arm_id = item.get("id") or item.get("track_id", "default")
            item["bandit_score"] = self.calculate_ucb_score(arm_id, x)
            item["selection_mode"] = "exploit"

        mature_candidates.sort(key=lambda item: item.get("bandit_score", 0.0), reverse=True)

        # Decide whether to allocate cold-start exploration slots (5% budget)
        selected: List[Dict[str, Any]] = []
        cold_quota = max(1, int(round(top_k * settings.COLD_START_EXPLORATION_RATE)))
        num_cold_to_pick = min(len(cold_candidates), cold_quota)

        if num_cold_to_pick > 0 and random.random() < 0.95:
            # Pick cold candidates closest to the user's acoustic cluster
            for cold in cold_candidates:
                emb = cold.get("embedding_vector")
                if emb and len(emb) == self.DIM:
                    c_vec = np.array(emb, dtype=np.float64)
                    sim = float(np.dot(x, c_vec) / (np.linalg.norm(c_vec) + 1e-9))
                else:
                    sim = 0.50
                cold["bandit_score"] = sim + 0.50  # Exploration boost
                cold["selection_mode"] = "first_play_explore"

            cold_candidates.sort(key=lambda c: c.get("bandit_score", 0.0), reverse=True)
            selected.extend(cold_candidates[:num_cold_to_pick])

        # Fill remaining slots from mature exploitation candidates
        remaining_slots = top_k - len(selected)
        selected.extend(mature_candidates[:remaining_slots])

        return selected

    def update_reward(self, arm_id: str, context_x: List[float], reward: float) -> None:
        """
        Online update:
        A_a <- A_a + x x^T
        b_a <- b_a + r x
        """
        model = self._get_arm_model(arm_id)
        x = np.array(context_x, dtype=np.float64)
        x_norm = np.linalg.norm(x)
        if x_norm > 0:
            x = x / x_norm

        # Update diagonal approximation
        model["A_diag"] += x * x
        model["A_inv"] = np.diag(1.0 / (model["A_diag"] + 1.0))
        model["b"] += reward * x
        model["count"] += 1

        # Periodic asynchronous persistence to Firestore
        if model["count"] % 10 == 0:
            doc_ref = self.db.collection("bandit_arms").document(arm_id)
            doc_ref.set(
                {
                    "A_diag": model["A_diag"].tolist(),
                    "b": model["b"].tolist(),
                    "pull_count": model["count"],
                    "updated_at": int(time.time() * 1000),
                },
                merge=True,
            )
