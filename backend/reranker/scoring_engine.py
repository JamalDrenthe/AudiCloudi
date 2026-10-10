"""
CloudiAudi Multi-Objective Scoring Engine.
Implements the formal ranking formula:
Score(u, i, c) = w_1(I_u) * S_retention(u, i) + w_2(I_u) * S_social(i) + w_3(I_u) * S_commercial(i) - Penalty_skip(u, i)
"""

from __future__ import annotations

import math
import time
from typing import Any, Dict, List, Optional
import numpy as np


class ScoringEngine:
    """Computes calibrated sub-scores and the composite ranking score."""

    HALF_LIFE_SOCIAL_HOURS = 48.0
    LAMBDA_SOC = math.log(2.0) / (HALF_LIFE_SOCIAL_HOURS * 3600.0 * 1000.0)

    HALF_LIFE_COMMERCIAL_HOURS = 72.0
    LAMBDA_COM = math.log(2.0) / (HALF_LIFE_COMMERCIAL_HOURS * 3600.0 * 1000.0)

    PENALTY_BETA = 1.50
    PENALTY_TAU_MS = 10000.0  # 10 seconds

    @staticmethod
    def compute_retention_score(
        user_vector: Optional[List[float]],
        track_vector: Optional[List[float]],
        completion_rate: float = 0.70,
        repeat_count: int = 0,
    ) -> float:
        """
        S_retention(u, i) = gamma_1 * cos_sim(u, i) + gamma_2 * completion_rate + gamma_3 * log(1 + repeats)
        """
        gamma_1 = 0.50
        gamma_2 = 0.35
        gamma_3 = 0.15

        cos_sim = 0.50
        if user_vector and track_vector and len(user_vector) == len(track_vector) and len(user_vector) > 0:
            u_np = np.array(user_vector, dtype=np.float32)
            t_np = np.array(track_vector, dtype=np.float32)
            norm_u = np.linalg.norm(u_np)
            norm_t = np.linalg.norm(t_np)
            if norm_u > 0 and norm_t > 0:
                raw_dot = float(np.dot(u_np, t_np) / (norm_u * norm_t))
                # Map [-1, 1] to [0, 1]
                cos_sim = max(0.0, min(1.0, (raw_dot + 1.0) / 2.0))

        clamped_completion = max(0.0, min(1.0, completion_rate))
        repeat_bonus = min(1.0, math.log(1.0 + repeat_count) / math.log(11.0))

        retention_score = gamma_1 * cos_sim + gamma_2 * clamped_completion + gamma_3 * repeat_bonus
        return float(round(retention_score, 4))

    def compute_social_score(
        self,
        track_data: Dict[str, Any],
        now_ms: Optional[float] = None,
    ) -> float:
        """
        S_social(i) = sum_k v_k * exp(-lambda_soc * (now - t_k))
        Weights: comment=2.0, repost=3.5, like=1.0, follow=5.0
        """
        if now_ms is None:
            now_ms = time.time() * 1000.0

        created_at = track_data.get("created_at", now_ms)
        age_ms = max(0.0, now_ms - created_at)
        time_decay = math.exp(-self.LAMBDA_SOC * age_ms)

        likes = track_data.get("likes_count", 0)
        reposts = track_data.get("reposts_count", 0)
        comments = track_data.get("comments_count", 0)

        # Baseline social score
        raw_social = (1.0 * likes) + (3.5 * reposts) + (2.0 * comments)
        decayed_social = raw_social * time_decay

        # Log-compression for stable scaling in [0, 1]
        normalized_social = math.log(1.0 + decayed_social) / math.log(1.0 + 1000.0)
        return float(round(min(1.0, max(0.0, normalized_social)), 4))

    def compute_commercial_score(
        self,
        track_data: Dict[str, Any],
        now_ms: Optional[float] = None,
    ) -> float:
        """
        S_commercial(i) = Rolling window cart-ratio & tier-weighted transactions:
        Exclusive (10.0) > Trackout (5.0) > WAV (2.5) > MP3 (1.0)
        """
        tiers = track_data.get("commercial_tiers", {})
        if not tiers:
            return 0.0

        # Extract tier availability and baseline pricing activity
        has_exclusive = tiers.get("exclusive", {}).get("enabled", False)
        has_trackout = tiers.get("trackout", {}).get("enabled", False)
        has_wav = tiers.get("wav_lease", {}).get("enabled", False)
        has_mp3 = tiers.get("basic_mp3", {}).get("enabled", False)

        tier_offering_weight = (
            (10.0 if has_exclusive else 0.0)
            + (5.0 if has_trackout else 0.0)
            + (2.5 if has_wav else 0.0)
            + (1.0 if has_mp3 else 0.0)
        ) / 18.5

        # Conversions from telemetry
        marketplace_conversions = track_data.get("marketplace_conversions_72h", 0)
        cart_adds = track_data.get("cart_adds_72h", 0)
        previews = max(1, track_data.get("marketplace_previews_72h", 1))

        conversion_ratio = min(1.0, (cart_adds * 0.5 + marketplace_conversions * 2.0) / float(previews))

        commercial_score = 0.40 * tier_offering_weight + 0.60 * conversion_ratio
        return float(round(commercial_score, 4))

    def compute_skip_penalty(
        self,
        duration_listened_ms: int,
        skipped_at_ms: Optional[int] = None,
    ) -> float:
        """
        Penalty_skip(u, i) = beta * exp(-duration / tau) * 1(duration < 30000)
        """
        actual_listen = duration_listened_ms
        if skipped_at_ms is not None:
            actual_listen = min(actual_listen, skipped_at_ms)

        if actual_listen >= 30000:
            return 0.0

        # Exponential penalty for early skip
        penalty = self.PENALTY_BETA * math.exp(-float(actual_listen) / self.PENALTY_TAU_MS)
        return float(round(penalty, 4))

    def compute_composite_score(
        self,
        user_profile: Dict[str, Any],
        track_data: Dict[str, Any],
        session_weights: Dict[str, float],
        duration_listened_ms: int = 45000,
        skipped_at_ms: Optional[int] = None,
    ) -> float:
        """
        Full composite calculation.
        """
        w_ret = session_weights.get("retention", 0.40)
        w_soc = session_weights.get("social", 0.35)
        w_com = session_weights.get("commercial", 0.25)

        user_vec = user_profile.get("affinity_vector")
        track_vec = track_data.get("embedding_vector")
        completion_rate = track_data.get("avg_completion_rate", 0.70)
        repeats = user_profile.get("track_repeats", {}).get(track_data.get("track_id", ""), 0)

        s_ret = self.compute_retention_score(user_vec, track_vec, completion_rate, repeats)
        s_soc = self.compute_social_score(track_data)
        s_com = self.compute_commercial_score(track_data)
        penalty = self.compute_skip_penalty(duration_listened_ms, skipped_at_ms)

        composite = (w_ret * s_ret) + (w_soc * s_soc) + (w_com * s_com) - penalty
        return float(round(max(0.0, composite), 4))
