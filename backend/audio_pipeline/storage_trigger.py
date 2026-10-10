"""
CloudiAudi Audio Ingestion Pipeline - Cloud Storage Eventarc Trigger.
Handles `google.cloud.storage.object.v1.finalized` on raw master uploads.
Executes the full pipeline:
1. Master Download
2. Chromaprint Duplicate Detection
3. EBU R128 (-14 LUFS) Normalization
4. 1000-Point Waveform Peak Extraction & Upload (/waveforms/{track_id}.json)
5. Multi-Bitrate HLS Transcoding & Upload (/hls_streams/{track_id}/)
6. Log-Mel Spectrogram (1, 128, 1292) Generation (/spectrograms/{track_id}.npy)
7. Firestore Track Document Update to status: "ready"
"""

from __future__ import annotations

import os
import shutil
import tempfile
import time
from typing import Any, Dict
from google.cloud.firestore import Client as FirestoreClient
from google.cloud.storage import Bucket as StorageBucket

from backend.core.config import get_firestore_client, get_storage_bucket
from backend.audio_pipeline.ffmpeg_worker import FFmpegWorker
from backend.audio_pipeline.spectrogram_generator import SpectrogramGenerator
from backend.audio_pipeline.chromaprint_hasher import ChromaprintHasher


def process_audio_master_event(event_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cloud Event entrypoint for google.cloud.storage.object.v1.finalized.
    """
    bucket_name = event_data.get("bucket")
    file_name = event_data.get("name", "")

    # Only process files in the raw_masters/ directory
    if not file_name.startswith("raw_masters/"):
        return {"status": "skipped", "reason": "Not in raw_masters folder"}

    # Extract track_id from 'raw_masters/{track_id}.wav'
    base_file = os.path.basename(file_name)
    track_id = os.path.splitext(base_file)[0]

    db: FirestoreClient = get_firestore_client()
    bucket: StorageBucket = get_storage_bucket()
    track_ref = db.collection("tracks").document(track_id)

    # Initialize workers
    ffmpeg = FFmpegWorker()
    spec_gen = SpectrogramGenerator()
    hasher = ChromaprintHasher()

    temp_dir = tempfile.mkdtemp(prefix=f"cloudiaudi_{track_id}_")

    try:
        # Mark track as processing in Firestore
        track_ref.set(
            {
                "status": "processing",
                "updated_at": int(time.time() * 1000),
            },
            merge=True,
        )

        # 1. Download Master File
        raw_master_blob = bucket.blob(file_name)
        local_raw_path = os.path.join(temp_dir, base_file)
        raw_master_blob.download_to_filename(local_raw_path)

        # 2. Duplicate Detection via Chromaprint
        fingerprint_hash = hasher.calculate_fingerprint(local_raw_path)
        is_duplicate, duplicate_track_id = hasher.check_duplicate_in_firestore(
            fingerprint_hash=fingerprint_hash,
            current_track_id=track_id,
            db=db,
        )
        if is_duplicate:
            track_ref.set(
                {
                    "status": "failed",
                    "error_reason": f"Duplicate audio collision with track {duplicate_track_id}",
                    "updated_at": int(time.time() * 1000),
                },
                merge=True,
            )
            return {
                "status": "rejected",
                "reason": "Duplicate detected",
                "duplicate_track_id": duplicate_track_id,
            }

        # 3. Audio Metadata & Loudness Normalization (-14 LUFS)
        meta = ffmpeg.get_audio_metadata(local_raw_path)
        duration_seconds = meta.get("duration_seconds", 0.0)

        normalized_wav_path = os.path.join(temp_dir, f"{track_id}_normalized.wav")
        ffmpeg.normalize_loudness_ebur128(
            input_path=local_raw_path,
            output_path=normalized_wav_path,
            target_lufs=-14.0,
        )

        # 4. 1000-Point Waveform Peak Extraction & Upload
        waveform_json_path = os.path.join(temp_dir, f"{track_id}_waveform.json")
        ffmpeg.extract_waveform_peaks(
            audio_path=normalized_wav_path,
            num_peaks=1000,
            output_json_path=waveform_json_path,
        )
        waveform_blob = bucket.blob(f"waveforms/{track_id}.json")
        waveform_blob.upload_from_filename(waveform_json_path, content_type="application/json")
        waveform_blob.make_public()
        waveform_url = waveform_blob.public_url

        # 5. Multi-Bitrate HLS Transcoding & Upload
        hls_output_dir = os.path.join(temp_dir, "hls")
        hls_files = ffmpeg.generate_hls_streams(normalized_wav_path, hls_output_dir)

        # Upload all HLS stream segments and playlists
        hls_base_gcs_path = f"hls_streams/{track_id}"
        for fname in os.listdir(hls_output_dir):
            fpath = os.path.join(hls_output_dir, fname)
            if os.path.isfile(fpath):
                content_type = "application/vnd.apple.mpegurl" if fname.endswith(".m3u8") else "video/MP2T"
                blob = bucket.blob(f"{hls_base_gcs_path}/{fname}")
                blob.upload_from_filename(fpath, content_type=content_type)
                blob.make_public()

        master_m3u8_blob = bucket.blob(f"{hls_base_gcs_path}/master.m3u8")
        hls_master_url = master_m3u8_blob.public_url

        # 6. Log-Mel Spectrogram Matrix (1, 128, 1292) Generation
        # Load normalized audio samples into numpy
        # Read raw samples using ffmpeg
        import numpy as np
        pcm_cmd = [
            "ffmpeg",
            "-i", normalized_wav_path,
            "-ac", "1",
            "-ar", "22050",
            "-f", "f32le",
            "-",
        ]
        import subprocess
        pcm_res = subprocess.run(pcm_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        samples = np.frombuffer(pcm_res.stdout, dtype=np.float32)

        mel_matrix = spec_gen.generate_log_mel_spectrogram(samples)
        spec_npy_path = os.path.join(temp_dir, f"{track_id}_spectrogram.npy")
        spec_gen.save_to_npy_file(mel_matrix, spec_npy_path)

        spec_blob = bucket.blob(f"spectrograms/{track_id}.npy")
        spec_blob.upload_from_filename(spec_npy_path, content_type="application/octet-stream")
        spectrogram_gcs_uri = f"gs://{bucket_name}/spectrograms/{track_id}.npy"

        # 7. Update Firestore Track Document with complete metadata
        track_ref.set(
            {
                "status": "ready",
                "duration_seconds": duration_seconds,
                "raw_master_path": file_name,
                "hls_master_url": hls_master_url,
                "waveform_json_url": waveform_url,
                "spectrogram_npy_path": spectrogram_gcs_uri,
                "audio_fingerprint_hash": fingerprint_hash,
                "updated_at": int(time.time() * 1000),
            },
            merge=True,
        )

        return {
            "status": "success",
            "track_id": track_id,
            "duration_seconds": duration_seconds,
            "waveform_url": waveform_url,
            "hls_master_url": hls_master_url,
        }

    except Exception as exc:
        track_ref.set(
            {
                "status": "failed",
                "error_reason": str(exc),
                "updated_at": int(time.time() * 1000),
            },
            merge=True,
        )
        raise exc

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
