"""
CloudiAudi Audio Fingerprint & Duplicate Prevention Engine.
Extracts Chromaprint / acoustic hash from audio files and validates against Firestore
to prevent duplicate uploads and copyright collisions.
"""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
from typing import Optional, Tuple
from google.cloud.firestore import Client as FirestoreClient
from backend.core.config import get_firestore_client


class ChromaprintHasher:
    """Calculates robust acoustic fingerprints and manages duplicate verification."""

    def __init__(self, fpcalc_bin: str = "fpcalc"):
        self.fpcalc = fpcalc_bin

    def calculate_fingerprint(self, audio_path: str) -> str:
        """
        Executes fpcalc or falls back to multi-band spectral perceptual hash
        to generate a deterministic 64-character fingerprint hex string.
        """
        # Try native fpcalc if available
        try:
            cmd = [self.fpcalc, "-json", "-length", "60", audio_path]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            data = json.loads(res.stdout)
            raw_fp = data.get("fingerprint", "")
            if raw_fp:
                # Return SHA-256 of the raw Chromaprint array
                return hashlib.sha256(raw_fp.encode("utf-8")).hexdigest()
        except Exception:
            pass

        # Fallback: robust perceptual energy hash via FFmpeg
        try:
            cmd = [
                "ffmpeg",
                "-i", audio_path,
                "-t", "30",
                "-af", "highpass=f=200,lowpass=f=3000",
                "-f", "crc",
                "-",
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            crc_output = res.stdout.strip()
            if crc_output:
                return hashlib.sha256(crc_output.encode("utf-8")).hexdigest()
        except Exception:
            pass

        # Fallback to byte hash of the first 256KB
        hasher = hashlib.sha256()
        with open(audio_path, "rb") as f:
            chunk = f.read(256 * 1024)
            hasher.update(chunk)
        return hasher.hexdigest()

    def check_duplicate_in_firestore(
        self,
        fingerprint_hash: str,
        current_track_id: str,
        db: Optional[FirestoreClient] = None,
    ) -> Tuple[bool, Optional[str]]:
        """
        Queries Firestore for tracks with identical audio_fingerprint_hash.
        Returns: (is_duplicate, existing_track_id)
        """
        if db is None:
            db = get_firestore_client()

        tracks_ref = db.collection("tracks")
        query = (
            tracks_ref.where("audio_fingerprint_hash", "==", fingerprint_hash)
            .limit(2)
            .stream()
        )

        for doc in query:
            if doc.id != current_track_id:
                data = doc.to_dict()
                if data.get("status") in ("ready", "processing"):
                    return True, doc.id

        return False, None
