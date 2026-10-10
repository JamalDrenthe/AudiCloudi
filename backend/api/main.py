"""
CloudiAudi Unified Production API - Main Application Entrypoint.
Deploys onto Google Cloud Run (2nd Gen Container).
Coordinates:
- Super Admin Control Plane
- Record Label Multi-Tenant Analytics
- Artist / Producer Diagnostics
- Clean Consumer / Guest Feeds
- Real-Time Telemetry Event Streaming (BigQuery & Firestore)
"""

from __future__ import annotations

import time
from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.core.config import settings
from backend.api.admin_api import router as admin_router
from backend.api.label_api import router as label_router
from backend.api.artist_api import router as artist_router
from backend.api.consumer_api import router as consumer_router
from backend.event_streaming.contracts import (
    AudioInteractionEvent,
    WaveformCommentEvent,
    MarketplaceEvent,
)
from backend.event_streaming.bigquery_streamer import BigQueryStreamer


app = FastAPI(
    title="CloudiAudi Multi-Tenant Audio Platform API",
    description=(
        "Production-grade unified audio infrastructure uniting streaming retention (Spotify), "
        "social waveform engagement (SoundCloud), and B2B beat licensing (BeatStars) on Google Firebase & Cloud Run."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration for Web and Mobile Clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Measures request execution time for observability."""
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000.0
    response.headers["X-Response-Time-Ms"] = f"{process_time:.2f}"
    return response


# Register Routers
app.include_router(admin_router)
app.include_router(label_router)
app.include_router(artist_router)
app.include_router(consumer_router)


# Telemetry Streaming Endpoints
streamer = BigQueryStreamer()


@app.post("/api/v1/events/audio", tags=["Realtime Telemetry"])
async def stream_audio_event(event: AudioInteractionEvent) -> Dict[str, Any]:
    """Ingests audio playback retention event to BigQuery and Firestore."""
    return streamer.stream_audio_interaction(event)


@app.post("/api/v1/events/comment", tags=["Realtime Telemetry"])
async def stream_comment_event(event: WaveformCommentEvent) -> Dict[str, Any]:
    """Ingests SoundCloud-style waveform timestamped comment to BigQuery and Firestore."""
    return streamer.stream_waveform_comment(event)


@app.post("/api/v1/events/marketplace", tags=["Realtime Telemetry"])
async def stream_marketplace_event(event: MarketplaceEvent) -> Dict[str, Any]:
    """Ingests BeatStars-style commercial funnel event to BigQuery and Firestore."""
    return streamer.stream_marketplace_event(event)


@app.get("/health", tags=["Health & Status"])
async def health_check() -> Dict[str, Any]:
    """Healthcheck endpoint for Cloud Run container probes."""
    return {
        "status": "healthy",
        "service": "cloudiaudi-unified-backend",
        "environment": settings.ENVIRONMENT,
        "project_id": settings.PROJECT_ID,
        "timestamp_ms": int(time.time() * 1000),
    }


@app.get("/", tags=["Health & Status"])
async def root() -> Dict[str, Any]:
    return {
        "platform": "CloudiAudi",
        "status": "online",
        "version": "2.0.0",
        "documentation": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.main:app", host=settings.HOST, port=settings.PORT, reload=True)
