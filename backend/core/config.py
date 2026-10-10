"""
CloudiAudi Core Configuration & Firebase Admin SDK Initialization.
Provides singleton access to Firebase Auth, Firestore, Cloud Storage, and Remote Config.
"""

from __future__ import annotations

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field
import firebase_admin
from firebase_admin import credentials, firestore, storage, remote_config
from google.cloud.firestore import Client as FirestoreClient
from google.cloud.storage import Bucket as StorageBucket


class Settings(BaseSettings):
    PROJECT_ID: str = Field(default="cloudiaudi", alias="GCP_PROJECT_ID")
    STORAGE_BUCKET_NAME: str = Field(default="cloudiaudi.firebasestorage.app", alias="FIREBASE_STORAGE_BUCKET")
    CREDENTIALS_PATH: Optional[str] = Field(default=None, alias="GOOGLE_APPLICATION_CREDENTIALS")
    PORT: int = Field(default=8080, alias="PORT")
    HOST: str = Field(default="0.0.0.0", alias="HOST")
    ENVIRONMENT: str = Field(default="production", alias="ENV")
    
    # Algorithmic Hyperparameters
    DEFAULT_RETENTION_WEIGHT: float = 0.40
    DEFAULT_SOCIAL_WEIGHT: float = 0.35
    DEFAULT_COMMERCIAL_WEIGHT: float = 0.25
    COLD_START_EXPLORATION_RATE: float = 0.05
    MMR_SIMILARITY_THRESHOLD: float = 0.85
    MMR_LAMBDA: float = 0.70
    GINI_TARGET_THRESHOLD: float = 0.55
    SKIP_PENALTY_BETA: float = 1.50
    SKIP_PENALTY_TAU_MS: float = 10000.0

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

# Global Firebase Admin instances
_firebase_app: Optional[firebase_admin.App] = None


def get_firebase_app() -> firebase_admin.App:
    """Initialize or retrieve the Firebase Admin App singleton."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    if not firebase_admin._apps:
        if settings.CREDENTIALS_PATH and os.path.exists(settings.CREDENTIALS_PATH):
            cred = credentials.Certificate(settings.CREDENTIALS_PATH)
            _firebase_app = firebase_admin.initialize_app(
                cred,
                {
                    "projectId": settings.PROJECT_ID,
                    "storageBucket": settings.STORAGE_BUCKET_NAME,
                },
            )
        else:
            # Fallback to Application Default Credentials on Cloud Run / GCP
            _firebase_app = firebase_admin.initialize_app(
                options={
                    "projectId": settings.PROJECT_ID,
                    "storageBucket": settings.STORAGE_BUCKET_NAME,
                }
            )
    else:
        _firebase_app = firebase_admin.get_app()

    return _firebase_app


def get_firestore_client() -> FirestoreClient:
    """Return the native Firestore Client initialized with the Firebase App."""
    get_firebase_app()
    return firestore.client()


def get_storage_bucket() -> StorageBucket:
    """Return the Cloud Storage Bucket instance."""
    get_firebase_app()
    return storage.bucket(settings.STORAGE_BUCKET_NAME)


def get_remote_config_parameters() -> dict[str, str]:
    """Fetch runtime hyperparameters from Firebase Remote Config or fallback to settings."""
    try:
        get_firebase_app()
        template = remote_config.get_template()
        params = {}
        for key, parameter in template.parameters.items():
            if parameter.default_value and hasattr(parameter.default_value, "value"):
                params[key] = parameter.default_value.value
        return params
    except Exception:
        return {
            "retention_weight": str(settings.DEFAULT_RETENTION_WEIGHT),
            "social_weight": str(settings.DEFAULT_SOCIAL_WEIGHT),
            "commercial_weight": str(settings.DEFAULT_COMMERCIAL_WEIGHT),
            "cold_start_rate": str(settings.COLD_START_EXPLORATION_RATE),
        }
