"""
CloudiAudi High-Performance Consumer & Guest Feeds API.
Engineered for sub-100ms p95 latency:
- Two-phase in-memory candidate retrieval & re-ranking
- Tier 1 warm-instance LRU caching + Tier 2 CDN edge caching
- Distributed sharded counter atomic increment endpoint
- W3C Server-Timing telemetry headers
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, Response, status
from pydantic import BaseModel, Field
from google.cloud.firestore import Client as FirestoreClient
from backend.core.config import get_firestore_client
from backend.core.cache import warm_cache
from backend.core.counters import increment_play_count, get_total_plays
from backend.core.auth_claims import UserRole
from backend.api.deps import get_current_token_claims
from backend.event_streaming.intent_engine import RealtimeSessionIntentEngine
from backend.reranker.production_reranker import CloudiAudiProductionReRanker


router = APIRouter(prefix="/api/v1/feed", tags=["Consumer & Guest Feeds"])


def sanitize_track_for_public(raw_track: Dict[str, Any]) -> Dict[str, Any]:
    """
    Strips internal algorithmic attribution, vector embeddings, and private splits.
    Leaves only consumer-facing playback, waveform, and marketplace actions.
    """
    tiers = raw_track.get("commercial_tiers", {})
    clean_tiers = {}
    if isinstance(tiers, dict):
        for tier_name, tier_data in tiers.items():
            if isinstance(tier_data, dict) and tier_data.get("enabled", False):
                clean_tiers[tier_name] = {
                    "name": tier_name,
                    "price_eur": tier_data.get("price_eur", 0.0),
                    "included_files": tier_data.get("included_files", []),
                    "allowed_streams_limit": tier_data.get("allowed_streams_limit"),
                    "broadcasting_rights": tier_data.get("broadcasting_rights", False),
                }

    return {
        "track_id": raw_track.get("id") or raw_track.get("track_id", ""),
        "title": raw_track.get("title", ""),
        "artist_id": raw_track.get("artist_id", raw_track.get("userId", "")),
        "artist_name": raw_track.get("artist_name", raw_track.get("artist", "CloudiArtist")),
        "genre": raw_track.get("genre", "Hip Hop"),
        "bpm": raw_track.get("bpm", 120.0),
        "musical_key": raw_track.get("musical_key", "C Minor"),
        "duration_seconds": raw_track.get("duration_seconds", 180.0),
        "cover_art_url": raw_track.get("cover_art_url", raw_track.get("coverUrl", "")),
        "video_canvas_url": raw_track.get("video_canvas_url", raw_track.get("videoUrl", "")),
        "audio_stream_url": raw_track.get("hls_master_url", raw_track.get("audioUrl", "")),
        "waveform_data_url": raw_track.get("waveform_json_url", ""),
        "plays_count": raw_track.get("plays_count", raw_track.get("playsCount", 0)),
        "likes_count": raw_track.get("likes_count", raw_track.get("likesCount", 0)),
        "reposts_count": raw_track.get("reposts_count", raw_track.get("repostsCount", 0)),
        "commercial_tiers": clean_tiers,
    }


@router.get("", summary="High-speed personalized feed for authenticated listeners & buyers")
async def get_personalized_feed(
    response: Response,
    genre: Optional[str] = None,
    limit: int = 20,
    claims: Dict[str, Any] = Depends(get_current_token_claims),
) -> Dict[str, Any]:
    """
    Personalized feed serving under 100ms via Two-Phase In-Memory Retrieval:
    - Phase 1: Retrieve candidate pool from warm-instance cache
    - Phase 2: Clustered LinUCB arm scoring + MMR diversity in-memory
    """
    user_id = claims.get("uid", "anonymous")
    db: FirestoreClient = get_firestore_client()

    # 1. Fetch user profile from warm cache or Firestore
    user_profile = warm_cache.get("user_profile", user_id)
    if not user_profile:
        user_doc = db.collection("users").document(user_id).get()
        user_profile = user_doc.to_dict() if user_doc.exists else {"user_id": user_id, "affinity_vector": None}
        warm_cache.set("user_profile", user_id, user_profile, ttl_seconds=120.0)

    # 2. Compute session intent
    intent_engine = RealtimeSessionIntentEngine(db=db)
    session_intent = intent_engine.calculate_session_intent(user_id=user_id)

    # 3. Two-Phase Re-Ranker
    reranker = CloudiAudiProductionReRanker(db=db)
    ranked_tracks, timings = reranker.rerank_feed(
        user_profile=user_profile,
        session_weights=session_intent.scoring_weights,
        genre_filter=genre,
        limit=min(50, limit),
    )

    # 4. Public Sanitization
    clean_feed = [sanitize_track_for_public(t) for t in ranked_tracks]

    # 5. Set W3C Server-Timing header for telemetry & observability
    server_timing = (
        f"retrieval;dur={timings['retrieval_ms']}, "
        f"rerank;dur={timings['rerank_ms']}, "
        f"total;dur={timings['total_ms']}"
    )
    response.headers["Server-Timing"] = server_timing
    response.headers["X-Cache-Hit"] = str(bool(timings["cache_hit"]))

    return {
        "status": "success",
        "feed_mode": "personalized_two_phase",
        "intent_context": session_intent.dominant_intent,
        "tracks_count": len(clean_feed),
        "timings_ms": timings,
        "tracks": clean_feed,
    }


@router.get("/guest", summary="Edge & CDN cached trending feed for sessionless guests")
async def get_guest_feed(
    response: Response,
    limit: int = 20,
) -> Dict[str, Any]:
    """
    Ultra-low-latency guest feed.
    Tier 1 in-memory cache delivers sub-10ms response time.
    Tier 2 edge headers instruct CDN to cache at edge.
    """
    t0 = time.time()
    cache_key = f"guest_trending_{limit}"
    cached_feed = warm_cache.get("trending_tracks", cache_key)

    if cached_feed is not None:
        duration_ms = round((time.time() - t0) * 1000.0, 2)
        response.headers["Server-Timing"] = f"cache;dur={duration_ms}"
        response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
        response.headers["Vary"] = "Accept-Encoding"
        return {
            "status": "success",
            "feed_mode": "cold_guest_trending_cached",
            "cached": True,
            "latency_ms": duration_ms,
            "tracks_count": len(cached_feed),
            "tracks": cached_feed,
        }

    # Cache miss: query Firestore
    db: FirestoreClient = get_firestore_client()
    tracks_ref = db.collection("tracks")
    query = (
        tracks_ref.where("status", "==", "ready")
        .order_by("plays_count", direction="DESCENDING")
        .limit(min(50, limit))
    )
    docs = list(query.stream())

    clean_feed = []
    for d in docs:
        track_dict = d.to_dict()
        track_dict["id"] = d.id
        clean_feed.append(sanitize_track_for_public(track_dict))

    # Cache in Tier 1 for 60 seconds
    warm_cache.set("trending_tracks", cache_key, clean_feed, ttl_seconds=60.0)

    duration_ms = round((time.time() - t0) * 1000.0, 2)
    response.headers["Server-Timing"] = f"db;dur={duration_ms}"
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    response.headers["Vary"] = "Accept-Encoding"

    return {
        "status": "success",
        "feed_mode": "cold_guest_trending_live",
        "cached": False,
        "latency_ms": duration_ms,
        "tracks_count": len(clean_feed),
        "tracks": clean_feed,
    }


class IncrementPlayPayload(BaseModel):
    user_id: Optional[str] = Field(default=None)
    session_id: Optional[str] = Field(default=None)


@router.post("/plays/{track_id}", summary="Distributed sharded counter atomic stream increment")
async def register_stream_play(
    track_id: str,
    payload: Optional[IncrementPlayPayload] = None,
) -> Dict[str, Any]:
    """
    Registers a stream playback by incrementing a distributed shard atomically.
    Completely eliminates Firestore 1 write/sec write-lock limits.
    """
    res = increment_play_count(track_id=track_id)
    return res


@router.get("/plays/{track_id}", summary="Get current aggregated plays for track")
async def get_stream_plays(track_id: str) -> Dict[str, Any]:
    """Retrieves real-time aggregate stream count across shards."""
    total = get_total_plays(track_id=track_id)
    return {
        "track_id": track_id,
        "total_plays": total,
    }
