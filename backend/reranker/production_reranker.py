"""
CloudiAudi Production Re-Ranker with Two-Phase In-Memory Retrieval & Clustered Bandit.
Sub-100ms End-to-End Pipeline:
1. Phase 1: Candidate retrieval with warm instance in-memory pooling (TTL=300s)
2. Phase 2: Clustered LinUCB arm scoring + Dynamic Multi-Objective Re-Ranking
3. Gini-Index Fairness Adjustment for emerging producers
4. Maximal Marginal Relevance (MMR) Acoustic Diversity (<0.85 threshold)
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from google.cloud.firestore import Client as FirestoreClient
from backend.core.config import get_firestore_client, settings
from backend.core.cache import warm_cache
from backend.reranker.scoring_engine import ScoringEngine
from backend.ml_kernel.vector_search import HybridSearchEngine
from backend.ml_kernel.contextual_bandit import clustered_bandit


class CloudiAudiProductionReRanker:
    """Production re-ranking service engineered for sub-100ms p95 latency."""

    def __init__(self, db: Optional[FirestoreClient] = None):
        self.db = db or get_firestore_client()
        self.scoring_engine = ScoringEngine()
        self.search_engine = HybridSearchEngine(self.db)
        self.bandit = clustered_bandit

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
            artist_id = item.get("artist_id", item.get("userId", "unknown"))
            plays = float(item.get("plays_count", item.get("playsCount", 0)))
            producer_impressions[artist_id] = producer_impressions.get(artist_id, 0.0) + plays

        gini = self.compute_gini_index(list(producer_impressions.values()))
        if gini > target_gini:
            delta = 0.25
            median_plays = float(np.median(list(producer_impressions.values()))) if producer_impressions else 100.0

            for item in candidates:
                artist_id = item.get("artist_id", item.get("userId", "unknown"))
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

        unselected.sort(key=lambda x: x.get("ranking_score", 0.0), reverse=True)
        seed = unselected.pop(0)
        selected.append(seed)

        while len(selected) < limit and unselected:
            best_idx = -1
            best_mmr_score = -float("inf")

            for idx, candidate in enumerate(unselected):
                cand_score = candidate.get("ranking_score", 0.0)
                cand_vec = candidate.get("embedding_vector", [])

                max_sim = 0.0
                if cand_vec and len(cand_vec) == 256:
                    for sel in selected:
                        sel_vec = sel.get("embedding_vector", [])
                        if sel_vec and len(sel_vec) == 256:
                            sim = self.calculate_cosine_similarity(cand_vec, sel_vec)
                            if sim > max_sim:
                                max_sim = sim

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

    def fetch_candidate_pool_two_phase(
        self,
        user_id: str,
        user_vec: Optional[List[float]],
        genre_filter: Optional[str] = None,
        pool_size: int = 50,
    ) -> Tuple[List[Dict[str, Any]], bool, float]:
        """
        Phase 1 Candidate Retrieval:
        Checks in-memory warm instance cache first (Tier 1).
        If cache miss, queries Firestore Vector Search / Filter once and caches for 300s.
        Returns: (candidate_pool, is_cache_hit, retrieval_duration_ms)
        """
        t0 = time.time()
        cache_key = f"{user_id}_{genre_filter or 'all'}"
        cached_pool = warm_cache.get("candidate_pool", cache_key)

        if cached_pool is not None and len(cached_pool) > 0:
            retrieval_ms = (time.time() - t0) * 1000.0
            return cached_pool, True, retrieval_ms

        # Cache Miss: Fetch from Firestore
        if user_vec and len(user_vec) == 256:
            candidates = self.search_engine.vector_search_nearest(query_vector=user_vec, limit=pool_size)
        else:
            candidates = self.search_engine.hybrid_metadata_filtered_search(
                genre=genre_filter, limit=pool_size
            )

        # Cache for 300 seconds (session lifetime)
        warm_cache.set("candidate_pool", cache_key, candidates, ttl_seconds=300.0)
        retrieval_ms = (time.time() - t0) * 1000.0
        return candidates, False, retrieval_ms

    def rerank_feed(
        self,
        user_profile: Dict[str, Any],
        session_weights: Dict[str, float],
        genre_filter: Optional[str] = None,
        limit: int = 20,
    ) -> Tuple[List[Dict[str, Any]], Dict[str, float]]:
        """
        End-to-End High-Speed Re-Ranking Pipeline (< 100ms p95):
        1. Two-Phase Candidate Retrieval (In-Memory Tier 1 Cache)
        2. Clustered LinUCB Arm Scoring
        3. Dynamic Composite Scoring
        4. Gini-Index Fairness Adjustment
        5. MMR Acoustic Diversity Re-ranking
        """
        start_total = time.time()
        user_id = user_profile.get("user_id", "guest")
        user_vec = user_profile.get("affinity_vector")

        # 1. Candidate Retrieval (Phase 1)
        candidates, is_cache_hit, retrieval_ms = self.fetch_candidate_pool_two_phase(
            user_id=user_id,
            user_vec=user_vec,
            genre_filter=genre_filter,
            pool_size=50,
        )

        start_rerank = time.time()

        # 2. Clustered LinUCB Scoring over Candidates
        user_ctx = user_vec if (user_vec and len(user_vec) == 256) else [0.0] * 256
        scored_candidates = self.bandit.select_tracks_from_pool(
            candidate_pool=candidates,
            user_context_vector=user_ctx,
            top_k=len(candidates),
        )

        # 3. Dynamic Multi-Objective Scoring
        for item in scored_candidates:
            score = self.scoring_engine.compute_composite_score(
                user_profile=user_profile,
                track_data=item,
                session_weights=session_weights,
            )
            item["ranking_score"] = score

        # 4. Gini Fairness Correction
        scored_candidates = self.apply_gini_fairness_adjustment(
            scored_candidates, target_gini=settings.GINI_TARGET_THRESHOLD
        )

        # 5. MMR Diversity Filtering (<0.85 similarity threshold)
        final_feed = self.apply_mmr_diversification(
            candidates=scored_candidates,
            limit=limit,
            lambda_param=settings.MMR_LAMBDA,
            similarity_threshold=settings.MMR_SIMILARITY_THRESHOLD,
        )

        rerank_ms = (time.time() - start_rerank) * 1000.0
        total_ms = (time.time() - start_total) * 1000.0

        timings = {
            "retrieval_ms": round(retrieval_ms, 2),
            "rerank_ms": round(rerank_ms, 2),
            "total_ms": round(total_ms, 2),
            "cache_hit": 1.0 if is_cache_hit else 0.0,
        }

        return final_feed, timings
