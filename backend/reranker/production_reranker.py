"""
CloudiAudi Production Re-Ranker.
Integrates:
1. Dynamic Composite Multi-Objective Scoring
2. Maximal Marginal Relevance (MMR) Diversity Re-Ranking (< 0.85 similarity threshold)
3. Gini-Index Fairness Adjustment for Long-Tail / Emerging Producers
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from google.cloud.firestore import Client as FirestoreClient
from backend.core.config import get_firestore_client, settings
from backend.reranker.scoring_engine import ScoringEngine
from backend.ml_kernel.vector_search import HybridSearchEngine


class CloudiAudiProductionReRanker:
    """Production Cloud Run re-ranking service."""

    def __init__(self, db: Optional[FirestoreClient] = None):
        self.db = db or get_firestore_client()
        self.scoring_engine = ScoringEngine()
        self.search_engine = HybridSearchEngine(self.db)

    @staticmethod
    def calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """Computes cosine similarity between two 256-d vectors."""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        v1 = np.array(vec1, dtype=np.float32)
        v2 = np.array(vec2, dtype=np.float32)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(v1, v2) / (norm1 * norm2))

    @staticmethod
    def compute_gini_index(values: List[float]) -> float:
        """
        Calculates the Gini coefficient of impression distribution.
        G = sum_i sum_j |y_i - y_j| / (2 * n^2 * mean(y))
        """
        if not values or len(values) < 2:
            return 0.0
        arr = np.array(values, dtype=np.float64)
        if np.all(arr == 0):
            return 0.0
        n = len(arr)
        mean_val = np.mean(arr)
        diff_sum = np.sum(np.abs(arr[:, None] - arr[None, :]))
        gini = diff_sum / (2.0 * (n ** 2) * mean_val)
        return float(gini)

    def apply_gini_fairness_adjustment(
        self,
        candidates: List[Dict[str, Any]],
        target_gini: float = 0.55,
    ) -> List[Dict[str, Any]]:
        """
        Adjusts track scores to boost emerging producers when the candidate pool
        impression distribution is overly concentrated (Gini > target_gini).
        """
        if not candidates:
            return candidates

        producer_impressions: Dict[str, float] = {}
        for item in candidates:
            artist_id = item.get("artist_id", "unknown")
            plays = float(item.get("plays_count", 0))
            producer_impressions[artist_id] = producer_impressions.get(artist_id, 0.0) + plays

        gini = self.compute_gini_index(list(producer_impressions.values()))
        if gini > target_gini:
            delta = 0.25
            median_plays = float(np.median(list(producer_impressions.values()))) if producer_impressions else 100.0

            for item in candidates:
                artist_id = item.get("artist_id", "unknown")
                artist_plays = producer_impressions.get(artist_id, 0.0)
                if artist_plays < median_plays:
                    boost = 1.0 + delta * (1.0 - (artist_plays / max(1.0, median_plays)))
                    orig_score = item.get("ranking_score", 0.50)
                    item["ranking_score"] = float(round(orig_score * boost, 4))
                    item["gini_fairness_boosted"] = True

        return candidates

    def apply_mmr_diversification(
        self,
        candidates: List[Dict[str, Any]],
        limit: int = 20,
        lambda_param: float = 0.70,
        similarity_threshold: float = 0.85,
    ) -> List[Dict[str, Any]]:
        """
        Maximal Marginal Relevance (MMR) greedy selection:
        i* = argmax_{i in R \\ S} [ lambda * Score(i) - (1 - lambda) * max_{j in S} Sim(e_i, e_j) ]
        Penalizes tracks with cosine similarity >= similarity_threshold (0.85).
        """
        if len(candidates) <= limit:
            return candidates

        selected: List[Dict[str, Any]] = []
        unselected = list(candidates)

        # 1. Pick the highest scoring item as the seed
        unselected.sort(key=lambda x: x.get("ranking_score", 0.0), reverse=True)
        seed = unselected.pop(0)
        selected.append(seed)

        # 2. Iteratively select remaining tracks
        while len(selected) < limit and unselected:
            best_idx = -1
            best_mmr_score = -float("inf")

            for idx, candidate in enumerate(unselected):
                cand_score = candidate.get("ranking_score", 0.0)
                cand_vec = candidate.get("embedding_vector", [])

                # Calculate maximum similarity with already selected tracks
                max_sim = 0.0
                if cand_vec and len(cand_vec) == 256:
                    for sel in selected:
                        sel_vec = sel.get("embedding_vector", [])
                        if sel_vec and len(sel_vec) == 256:
                            sim = self.calculate_cosine_similarity(cand_vec, sel_vec)
                            if sim > max_sim:
                                max_sim = sim

                # Apply hard penalty if similarity exceeds the 0.85 acoustic threshold
                excess_penalty = 1.5 if max_sim >= similarity_threshold else 0.0

                mmr = (lambda_param * cand_score) - ((1.0 - lambda_param) * max_sim) - excess_penalty

                if mmr > best_mmr_score:
                    best_mmr_score = mmr
                    best_idx = idx

            if best_idx >= 0:
                chosen = unselected.pop(best_idx)
                selected.append(chosen)
            else:
                break

        return selected

    def rerank_feed(
        self,
        user_profile: Dict[str, Any],
        session_weights: Dict[str, float],
        genre_filter: Optional[str] = None,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        End-to-End Re-Ranking Pipeline:
        1. Candidate Retrieval (top 100 via Vector Search / Metadata)
        2. Dynamic Composite Multi-Objective Scoring
        3. Gini-Index Producer Fairness Elevation
        4. MMR Diversity Re-Ranking (< 0.85 acoustic similarity threshold)
        """
        user_vec = user_profile.get("affinity_vector")

        # 1. Fetch top 100 candidate tracks
        if user_vec and len(user_vec) == 256:
            candidates = self.search_engine.vector_search_nearest(query_vector=user_vec, limit=100)
        else:
            candidates = self.search_engine.hybrid_metadata_filtered_search(
                genre=genre_filter, limit=100
            )

        # 2. Compute dynamic multi-objective scores for every candidate
        for item in candidates:
            score = self.scoring_engine.compute_composite_score(
                user_profile=user_profile,
                track_data=item,
                session_weights=session_weights,
            )
            item["ranking_score"] = score

        # 3. Gini Fairness Correction for long-tail artists
        candidates = self.apply_gini_fairness_adjustment(
            candidates, target_gini=settings.GINI_TARGET_THRESHOLD
        )

        # 4. MMR Acoustic Diversity Filtering
        final_feed = self.apply_mmr_diversification(
            candidates=candidates,
            limit=limit,
            lambda_param=settings.MMR_LAMBDA,
            similarity_threshold=settings.MMR_SIMILARITY_THRESHOLD,
        )

        return final_feed
