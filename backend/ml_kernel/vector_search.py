"""
CloudiAudi Hybrid Search Engine.
Combines:
1. Firestore Vector Search (FindNearest Cosine Distance on 256-d embeddings)
2. Structured Metadata Pre-Filtering (genre, BPM range, musical key, license availability)
3. BM25 Text Search over titles, artist names, and producer tags
"""

from __future__ import annotations

import math
import re
from typing import Any, Dict, List, Optional
import numpy as np
from google.cloud.firestore import Client as FirestoreClient
from google.cloud.firestore_v1.vector import Vector
from google.cloud.firestore_v1.base_vector_query import DistanceMeasure
from backend.core.config import get_firestore_client


class HybridSearchEngine:
    """Multi-stage hybrid search engine powering candidate retrieval."""

    def __init__(self, db: Optional[FirestoreClient] = None):
        self.db = db or get_firestore_client()

    def vector_search_nearest(
        self,
        query_vector: List[float],
        limit: int = 50,
        distance_measure: DistanceMeasure = DistanceMeasure.COSINE,
    ) -> List[Dict[str, Any]]:
        """
        Executes native Firestore Vector Search (FindNearest) using the 256-d embedding.
        Falls back to in-memory cosine ranking if vector indexes are building.
        """
        tracks_ref = self.db.collection("tracks")
        results = []

        try:
            vector_query = tracks_ref.where("status", "==", "ready").find_nearest(
                vector_field="embedding_vector",
                query_vector=Vector(query_vector),
                distance_measure=distance_measure,
                limit=limit,
                distance_result_field="vector_distance",
            )
            docs = vector_query.stream()
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                results.append(data)
            return results
        except Exception:
            # High-performance fallback: fetch active tracks and compute cosine similarity in numpy
            candidates = list(
                tracks_ref.where("status", "==", "ready").limit(limit * 3).stream()
            )
            q_vec = np.array(query_vector, dtype=np.float32)
            q_norm = np.linalg.norm(q_vec) + 1e-9

            scored_candidates = []
            for doc in candidates:
                d = doc.to_dict()
                d["id"] = doc.id
                emb = d.get("embedding_vector")
                if emb and len(emb) == 256:
                    t_vec = np.array(emb, dtype=np.float32)
                    sim = float(np.dot(q_vec, t_vec) / (q_norm * (np.linalg.norm(t_vec) + 1e-9)))
                    d["vector_distance"] = 1.0 - sim
                    d["vector_similarity"] = sim
                    scored_candidates.append(d)

            scored_candidates.sort(key=lambda x: x.get("vector_distance", 1.0))
            return scored_candidates[:limit]

    def hybrid_metadata_filtered_search(
        self,
        query_vector: Optional[List[float]] = None,
        genre: Optional[str] = None,
        min_bpm: Optional[float] = None,
        max_bpm: Optional[float] = None,
        musical_key: Optional[str] = None,
        require_exclusive_license: bool = False,
        require_wav_lease: bool = False,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Executes compound pre-filtered search with Firestore constraints.
        """
        tracks_ref = self.db.collection("tracks")
        query = tracks_ref.where("status", "==", "ready")

        if genre:
            query = query.where("genre", "==", genre)
        if musical_key:
            query = query.where("musical_key", "==", musical_key)

        docs = list(query.limit(limit * 2).stream())
        filtered: List[Dict[str, Any]] = []

        for doc in docs:
            d = doc.to_dict()
            d["id"] = doc.id
            bpm = d.get("bpm", 120.0)

            # BPM Range Filtering
            if min_bpm is not None and bpm < min_bpm:
                continue
            if max_bpm is not None and bpm > max_bpm:
                continue

            # Commercial License Availability
            tiers = d.get("commercial_tiers", {})
            if require_exclusive_license:
                excl = tiers.get("exclusive", {})
                if not excl.get("enabled", False):
                    continue
            if require_wav_lease:
                wav = tiers.get("wav_lease", {})
                if not wav.get("enabled", False):
                    continue

            filtered.append(d)

        # If acoustic query vector is supplied, re-rank by cosine similarity
        if query_vector and len(query_vector) == 256:
            q_vec = np.array(query_vector, dtype=np.float32)
            q_norm = np.linalg.norm(q_vec) + 1e-9
            for item in filtered:
                emb = item.get("embedding_vector")
                if emb and len(emb) == 256:
                    t_vec = np.array(emb, dtype=np.float32)
                    sim = float(np.dot(q_vec, t_vec) / (q_norm * (np.linalg.norm(t_vec) + 1e-9)))
                    item["vector_similarity"] = sim
                else:
                    item["vector_similarity"] = 0.50
            filtered.sort(key=lambda x: x.get("vector_similarity", 0.0), reverse=True)

        return filtered[:limit]

    def bm25_text_search(
        self,
        search_query: str,
        limit: int = 30,
    ) -> List[Dict[str, Any]]:
        """
        Deterministic in-memory BM25 tokenizer and ranker over track titles,
        tags, and artist names (serves as immediate search engine).
        """
        if not search_query.strip():
            return []

        tokens = re.findall(r"\w+", search_query.lower())
        if not tokens:
            return []

        docs = list(self.db.collection("tracks").where("status", "==", "ready").limit(200).stream())
        corpus = []
        doc_map = []

        for doc in docs:
            d = doc.to_dict()
            d["id"] = doc.id
            title = str(d.get("title", "")).lower()
            artist = str(d.get("artist_name", "")).lower()
            tags = " ".join([str(t).lower() for t in d.get("tags", [])])
            genre = str(d.get("genre", "")).lower()
            full_text = f"{title} {artist} {tags} {genre}"
            words = re.findall(r"\w+", full_text)
            corpus.append(words)
            doc_map.append(d)

        # BM25 parameters
        k1 = 1.5
        b = 0.75
        N = len(corpus)
        if N == 0:
            return []

        avg_dl = sum(len(doc_tokens) for doc_tokens in corpus) / float(N)

        # Calculate IDF
        idf = {}
        for token in tokens:
            doc_freq = sum(1 for doc_tokens in corpus if token in doc_tokens)
            idf[token] = math.log(1.0 + (N - doc_freq + 0.5) / (doc_freq + 0.5))

        scores = []
        for idx, doc_tokens in enumerate(corpus):
            dl = len(doc_tokens)
            doc_score = 0.0
            for token in tokens:
                tf = doc_tokens.count(token)
                if tf > 0:
                    numerator = tf * (k1 + 1)
                    denominator = tf + k1 * (1 - b + b * (dl / avg_dl))
                    doc_score += idf.get(token, 0.0) * (numerator / denominator)

            if doc_score > 0.0:
                item = doc_map[idx]
                item["bm25_score"] = float(round(doc_score, 4))
                scores.append(item)

        scores.sort(key=lambda x: x["bm25_score"], reverse=True)
        return scores[:limit]
