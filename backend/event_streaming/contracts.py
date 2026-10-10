"""
CloudiAudi Event Streaming Contracts (Pydantic V2).
Defines real-time telemetry events for:
- Audio Playback & Retention Tracking
- SoundCloud-style Waveform Timestamped Comments
- BeatStars-style Marketplace & License Conversion Funnel
Includes schema definitions for Firebase Extension "Stream Collections to BigQuery".
"""

from __future__ import annotations

import time
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class MarketplaceEventType(str, Enum):
    PREVIEW = "preview"
    ADD_TO_CART = "add_to_cart"
    CHECKOUT_START = "checkout_start"
    LICENSE_PURCHASE = "license_purchase"


class CommercialLicenseType(str, Enum):
    BASIC_MP3 = "basic_mp3"
    WAV_LEASE = "wav_lease"
    TRACKOUT = "trackout"
    EXCLUSIVE = "exclusive"


class AudioInteractionEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")

    event_id: Optional[str] = None
    user_id: str = Field(description="Authenticated user UID or guest_anon_id")
    track_id: str
    duration_listened_ms: int = Field(ge=0, description="Total listening duration in ms")
    track_total_ms: int = Field(gt=0, description="Total duration of track in ms")
    completed: bool = Field(default=False, description="True if listened to >= 85%")
    skipped_at_ms: Optional[int] = Field(default=None, description="Playback timestamp when skip occurred")
    repeated: bool = Field(default=False)
    saved: bool = Field(default=False)
    playlist_added: bool = Field(default=False)
    device_type: str = Field(default="web", description="web, ios, android, desktop")
    timestamp: int = Field(default_factory=lambda: int(time.time() * 1000))

    @property
    def completion_rate(self) -> float:
        if self.track_total_ms == 0:
            return 0.0
        return min(1.0, self.duration_listened_ms / float(self.track_total_ms))

    @property
    def is_early_skip(self) -> bool:
        """Skip within the critical first 30 seconds."""
        if self.skipped_at_ms is not None:
            return self.skipped_at_ms < 30000
        return self.duration_listened_ms < 30000 and not self.completed

    def to_bigquery_row(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "track_id": self.track_id,
            "duration_listened_ms": self.duration_listened_ms,
            "track_total_ms": self.track_total_ms,
            "completion_rate": self.completion_rate,
            "completed": self.completed,
            "is_early_skip": self.is_early_skip,
            "skipped_at_ms": self.skipped_at_ms,
            "repeated": self.repeated,
            "saved": self.saved,
            "playlist_added": self.playlist_added,
            "device_type": self.device_type,
            "timestamp_ms": self.timestamp,
        }


class WaveformCommentEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")

    comment_id: Optional[str] = None
    user_id: str
    track_id: str
    timestamp_ms: int = Field(ge=0, description="Specific timestamp along the waveform where comment is placed")
    comment_text: str = Field(min_length=1, max_length=1000)
    sentiment_score: float = Field(
        default=0.0,
        ge=-1.0,
        le=1.0,
        description="Sentiment valence: -1.0 (strongly negative) to +1.0 (strongly positive)",
    )
    likes_count: int = Field(default=0, ge=0)
    created_at: int = Field(default_factory=lambda: int(time.time() * 1000))

    def to_bigquery_row(self) -> Dict[str, Any]:
        return {
            "comment_id": self.comment_id,
            "user_id": self.user_id,
            "track_id": self.track_id,
            "timestamp_ms": self.timestamp_ms,
            "comment_text": self.comment_text,
            "sentiment_score": self.sentiment_score,
            "likes_count": self.likes_count,
            "created_at_ms": self.created_at,
        }


class MarketplaceEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")

    event_id: Optional[str] = None
    user_id: str
    track_id: str
    event_type: MarketplaceEventType
    license_type: CommercialLicenseType
    price_usd: float = Field(ge=0.0)
    stripe_session_id: Optional[str] = None
    created_at: int = Field(default_factory=lambda: int(time.time() * 1000))

    @property
    def tier_importance_weight(self) -> float:
        """Tier weighting: Exclusive (10.0) > Trackout (5.0) > WAV (2.5) > MP3 (1.0)."""
        weights = {
            CommercialLicenseType.EXCLUSIVE: 10.0,
            CommercialLicenseType.TRACKOUT: 5.0,
            CommercialLicenseType.WAV_LEASE: 2.5,
            CommercialLicenseType.BASIC_MP3: 1.0,
        }
        return weights.get(self.license_type, 1.0)

    def to_bigquery_row(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "track_id": self.track_id,
            "event_type": self.event_type.value,
            "license_type": self.license_type.value,
            "price_usd": self.price_usd,
            "tier_weight": self.tier_importance_weight,
            "created_at_ms": self.created_at,
        }
