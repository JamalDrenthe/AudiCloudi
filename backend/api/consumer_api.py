"""
CloudiAudi Clean Consumer & Guest Feeds API.
Endpoints:
- GET /api/v1/feed: Sanitized personalized feed for authenticated listeners & buyers
- GET /api/v1/feed/guest: Sessionless feed ranked by platform-velocity with Cloud CDN caching
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, Response, status
from google.cloud.firestore import Client as FirestoreClient
from backend.core.config import get_firestore_client
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


@router.get("", summary="Personalized feed for authenticated listeners & buyers")
async def get_personalized_feed(
    genre: Optional[str] = None,
    limit: int = 20,
    claims: Dict[str, Any] = Depends(get_current_token_claims),
) -> Dict[str, Any]:
    """
    Ranks tracks using the Production Re-Ranker and user session intent.
    Outputs clean, consumer-ready payloads.
    """
    user_id = claims.get("uid", "anonymous")
    db: FirestoreClient = get_firestore_client()

    # 1. Fetch user profile
    user_doc = db.collection("users").document(user_id).get()
    user_profile = user_doc.to_dict() if user_doc.exists else {"affinity_vector": None}

    # 2. Compute realtime session intent weights
    intent_engine = RealtimeSessionIntentEngine(db=db)
    session_intent = intent_engine.calculate_session_intent(user_id=user_id)

    # 3. Execute Production Re-Ranker (MMR + Gini fairness)
    reranker = CloudiAudiProductionReRanker(db=db)
    ranked_tracks = reranker.rerank_feed(
        user_profile=user_profile,
        session_weights=session_intent.scoring_weights,
        genre_filter=genre,
        limit=min(50, limit),
    )

    # 4. Sanitize internal fields
    clean_feed = [sanitize_track_for_public(t) for t in ranked_tracks]

    return {
        "status": "success",
        "feed_mode": "personalized",
        "intent_context": session_intent.dominant_intent,
        "tracks_count": len(clean_feed),
        "tracks": clean_feed,
    }


@router.get("/guest", summary="Sessionless feed based on realtime velocity with CDN caching")
async def get_guest_feed(
    response: Response,
    limit: int = 20,
) -> Dict[str, Any]:
    """
    Public feed ranked by platform-wide trending velocity (plays/likes).
    Applies aggressive Cloud CDN caching headers.
    """
    db: FirestoreClient = get_firestore_client()
    tracks_ref = db.collection("tracks")

    # Order by plays count (trending velocity)
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

    # Cloud CDN Caching Headers (cached at edge for 60 seconds, stale-while-revalidate 300)
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    response.headers["Vary"] = "Accept-Encoding"

    return {
        "status": "success",
        "feed_mode": "cold_guest_trending",
        "tracks_count": len(clean_feed),
        "tracks": clean_feed,
    }
