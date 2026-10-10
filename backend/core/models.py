"""
CloudiAudi Firestore Document Data Models (Pydantic V2).
Defines schemas for:
- /tenants/{label_id}
- /users/{user_id}
- /tracks/{track_id}
- /tracks/{track_id}/interactions/{interaction_id}
Includes Commercial Licensing Tiers and Royalty Split Sheets.
"""

from __future__ import annotations

import time
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class TenantRoster(BaseModel):
    model_config = ConfigDict(extra="ignore")

    label_id: str
    label_name: str
    slug: str
    contact_email: str
    artist_ids: List[str] = Field(default_factory=list)
    manager_uids: List[str] = Field(default_factory=list)
    stripe_account_id: Optional[str] = None
    payout_status: str = Field(default="pending", description="pending, active, restricted")
    currency: str = Field(default="EUR")
    charges_enabled: bool = False
    payouts_enabled: bool = False
    default_label_percentage: float = Field(default=20.0, ge=0.0, le=100.0)
    payout_interval_days: int = Field(default=30, ge=1)
    created_at: int = Field(default_factory=lambda: int(time.time() * 1000))
    updated_at: int = Field(default_factory=lambda: int(time.time() * 1000))


class UserListeningProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")

    total_listen_time_ms: int = Field(default=0, ge=0)
    total_streams_count: int = Field(default=0, ge=0)
    total_skips_count: int = Field(default=0, ge=0)
    genre_affinities: Dict[str, float] = Field(default_factory=dict)
    affinity_vector: Optional[List[float]] = Field(
        default=None,
        description="256-dimensional user preference embedding vector",
    )
    last_played_track_id: Optional[str] = None
    recent_searches: List[str] = Field(default_factory=list)


class ActiveSessionStatus(BaseModel):
    model_config = ConfigDict(extra="ignore")

    session_id: Optional[str] = None
    is_active: bool = False
    device_type: str = Field(default="desktop")  # web, mobile_ios, mobile_android, desktop
    ip_country: Optional[str] = None
    current_track_id: Optional[str] = None
    playback_position_ms: int = Field(default=0, ge=0)
    last_heartbeat_at: int = Field(default_factory=lambda: int(time.time() * 1000))


class UserDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user_id: str
    email: str
    username: str
    display_name: str
    role: str = Field(default="listener_user")
    tenant_id: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    bio: Optional[str] = None
    credit_balance: int = Field(default=0, ge=0)
    credit_tier: str = Field(default="free")  # free, user, artist, label
    monthly_uploads_remaining: int = Field(default=0, ge=0)
    listening_profile: UserListeningProfile = Field(default_factory=UserListeningProfile)
    session_status: ActiveSessionStatus = Field(default_factory=ActiveSessionStatus)
    social_links: Dict[str, str] = Field(
        default_factory=lambda: {"tiktok": "", "youtube": "", "instagram": "", "x": ""}
    )
    followers_count: int = Field(default=0, ge=0)
    following_count: int = Field(default=0, ge=0)
    created_at: int = Field(default_factory=lambda: int(time.time() * 1000))
    updated_at: int = Field(default_factory=lambda: int(time.time() * 1000))


class CommercialTier(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(description="basic_mp3, wav_lease, trackout, exclusive")
    enabled: bool = True
    price_eur: float = Field(ge=0.0)
    included_files: List[str] = Field(default_factory=list)  # ["mp3", "wav", "stems"]
    allowed_streams_limit: Optional[int] = None  # None = unlimited
    distribution_limit: Optional[int] = None
    broadcasting_rights: bool = False
    exclusive_buyout: bool = False
    contract_template_id: Optional[str] = "standard_lease_v1"


class CommercialTiersConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    basic_mp3: CommercialTier = Field(
        default_factory=lambda: CommercialTier(
            name="basic_mp3",
            enabled=True,
            price_eur=19.99,
            included_files=["mp3_320kbps"],
            allowed_streams_limit=100000,
            distribution_limit=5000,
            broadcasting_rights=False,
            exclusive_buyout=False,
        )
    )
    wav_lease: CommercialTier = Field(
        default_factory=lambda: CommercialTier(
            name="wav_lease",
            enabled=True,
            price_eur=49.99,
            included_files=["mp3_320kbps", "wav_24bit"],
            allowed_streams_limit=500000,
            distribution_limit=25000,
            broadcasting_rights=True,
            exclusive_buyout=False,
        )
    )
    trackout: CommercialTier = Field(
        default_factory=lambda: CommercialTier(
            name="trackout",
            enabled=True,
            price_eur=99.99,
            included_files=["mp3_320kbps", "wav_24bit", "stems_zip"],
            allowed_streams_limit=1000000,
            distribution_limit=100000,
            broadcasting_rights=True,
            exclusive_buyout=False,
        )
    )
    exclusive: CommercialTier = Field(
        default_factory=lambda: CommercialTier(
            name="exclusive",
            enabled=False,
            price_eur=499.99,
            included_files=["mp3_320kbps", "wav_24bit", "stems_zip", "midi"],
            allowed_streams_limit=None,
            distribution_limit=None,
            broadcasting_rights=True,
            exclusive_buyout=True,
        )
    )


class RoyaltySplitCollaborator(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user_id: str
    role_description: str  # producer, composer, songwriter, vocalist, label
    share_percentage: float = Field(ge=0.0, le=100.0)
    stripe_account_id: Optional[str] = None


class RoyaltySplitSheet(BaseModel):
    model_config = ConfigDict(extra="ignore")

    splits: List[RoyaltySplitCollaborator] = Field(default_factory=list)
    label_cut_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    locked_for_payout: bool = False

    @field_validator("splits")
    @classmethod
    def validate_total_shares(cls, v: List[RoyaltySplitCollaborator]) -> List[RoyaltySplitCollaborator]:
        total = sum(item.share_percentage for item in v)
        if total > 100.01:
            raise ValueError(f"Total split percentages ({total}%) exceed 100%")
        return v


class AlgorithmicAttribution(BaseModel):
    model_config = ConfigDict(extra="ignore")

    organic_pct: float = Field(default=0.70, ge=0.0, le=1.0)
    explore_pct: float = Field(default=0.05, ge=0.0, le=1.0)
    exploit_pct: float = Field(default=0.25, ge=0.0, le=1.0)
    last_computed_at: int = Field(default_factory=lambda: int(time.time() * 1000))


class TrackProcessingStatus(str, Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    SUPPRESSED = "suppressed"


class TrackDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")

    track_id: str
    artist_id: str
    artist_name: str
    tenant_id: Optional[str] = None
    title: str
    genre: str = Field(default="Hip Hop")
    subgenres: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    bpm: float = Field(default=120.0, ge=30.0, le=300.0)
    musical_key: str = Field(default="C Minor")
    duration_seconds: float = Field(default=0.0, ge=0.0)
    status: TrackProcessingStatus = Field(default=TrackProcessingStatus.PROCESSING)

    # Cloud Storage Asset URIs
    raw_master_path: Optional[str] = None
    hls_master_url: Optional[str] = None
    waveform_json_url: Optional[str] = None
    spectrogram_npy_path: Optional[str] = None
    cover_art_url: Optional[str] = None
    video_canvas_url: Optional[str] = None
    audio_fingerprint_hash: Optional[str] = None

    # Algorithmic & Acoustic Embeddings
    embedding_vector: Optional[List[float]] = Field(
        default=None,
        description="256-dimensional deep acoustic embedding normalized vector",
    )
    cold_start_plays_count: int = Field(default=0, ge=0)
    is_cold_start: bool = True
    algorithmic_health_score: float = Field(default=50.0, ge=0.0, le=100.0)
    algorithmic_attribution: AlgorithmicAttribution = Field(default_factory=AlgorithmicAttribution)

    # Engagement Counters
    plays_count: int = Field(default=0, ge=0)
    likes_count: int = Field(default=0, ge=0)
    reposts_count: int = Field(default=0, ge=0)
    comments_count: int = Field(default=0, ge=0)
    saves_count: int = Field(default=0, ge=0)

    # Commercial Marketplace Configuration
    commercial_tiers: CommercialTiersConfig = Field(default_factory=CommercialTiersConfig)
    royalty_split_sheet: RoyaltySplitSheet = Field(default_factory=RoyaltySplitSheet)

    created_at: int = Field(default_factory=lambda: int(time.time() * 1000))
    updated_at: int = Field(default_factory=lambda: int(time.time() * 1000))


class InteractionEventType(str, Enum):
    STREAM_START = "stream_start"
    STREAM_PROGRESS = "stream_progress"
    STREAM_COMPLETE = "stream_complete"
    STREAM_SKIP = "stream_skip"
    SEEK = "seek"
    LIKE = "like"
    UNLIKE = "unlike"
    REPOST = "repost"
    UNREPOST = "unrepost"
    COMMENT = "comment"
    PLAYLIST_ADD = "playlist_add"
    PREVIEW_LICENSE = "preview_license"
    ADD_TO_CART = "add_to_cart"
    CHECKOUT_START = "checkout_start"
    LICENSE_PURCHASE = "license_purchase"


class TrackInteractionDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")

    interaction_id: str
    track_id: str
    user_id: str
    event_type: InteractionEventType
    duration_listened_ms: int = Field(default=0, ge=0)
    track_total_ms: int = Field(default=0, ge=0)
    skipped_at_ms: Optional[int] = None
    repeated: bool = False
    device_type: str = Field(default="web")
    client_timestamp_ms: int = Field(default_factory=lambda: int(time.time() * 1000))
    created_at: int = Field(default_factory=lambda: int(time.time() * 1000))
    commercial_tier_name: Optional[str] = None
    price_paid_eur: Optional[float] = None
    comment_text: Optional[str] = None
    comment_timestamp_ms: Optional[int] = None
    sentiment_score: Optional[float] = Field(default=None, ge=-1.0, le=1.0)
