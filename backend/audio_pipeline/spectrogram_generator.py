"""
CloudiAudi Spectrogram Generator.
Computes Log-Mel Spectrogram matrix of exact dimensions: (1, 128, 1292)
Representing a 30-second audio window @ 22,050 Hz with 128 Mel bands.
Includes standalone vectorized NumPy/SciPy STFT and Mel filterbank generation.
"""

from __future__ import annotations

import io
import math
import os
from typing import Tuple
import numpy as np


def create_mel_filterbank(
    sample_rate: int = 22050,
    n_fft: int = 2048,
    n_mels: int = 128,
    f_min: float = 20.0,
    f_max: float = 11025.0,
) -> np.ndarray:
    """Creates a triangular Mel filterbank matrix of shape (n_mels, 1 + n_fft // 2)."""
    def hz_to_mel(hz: float) -> float:
        return 2595.0 * math.log10(1.0 + hz / 700.0)

    def mel_to_hz(mel: float) -> float:
        return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)

    mel_min = hz_to_mel(f_min)
    mel_max = hz_to_mel(f_max)
    mel_points = np.linspace(mel_min, mel_max, n_mels + 2)
    hz_points = np.array([mel_to_hz(m) for m in mel_points])
    bin_points = np.floor((n_fft + 1) * hz_points / sample_rate).astype(int)

    num_bins = 1 + n_fft // 2
    filterbank = np.zeros((n_mels, num_bins), dtype=np.float32)

    for m in range(1, n_mels + 1):
        f_left = bin_points[m - 1]
        f_center = bin_points[m]
        f_right = bin_points[m + 1]

        if f_center > f_left:
            for k in range(f_left, f_center):
                if k < num_bins:
                    filterbank[m - 1, k] = (k - f_left) / (f_center - f_left)
        if f_right > f_center:
            for k in range(f_center, f_right):
                if k < num_bins:
                    filterbank[m - 1, k] = (f_right - k) / (f_right - f_center)

    # Normalize filterbank (Slaney-style area normalization)
    enorm = 2.0 / (hz_points[2 : n_mels + 2] - hz_points[:n_mels])
    filterbank *= enorm[:, np.newaxis]
    return filterbank


class SpectrogramGenerator:
    """Computes fixed-size Log-Mel Spectrogram matrices for neural inference."""

    TARGET_SAMPLE_RATE = 22050
    TARGET_DURATION_SEC = 30.0
    TARGET_SAMPLES = int(TARGET_SAMPLE_RATE * TARGET_DURATION_SEC)  # 661,500 samples
    N_FFT = 2048
    HOP_LENGTH = 512
    N_MELS = 128
    TARGET_FRAMES = 1292  # Expected frames: (661500 / 512) ≈ 1292

    def __init__(self):
        self.mel_fb = create_mel_filterbank(
            sample_rate=self.TARGET_SAMPLE_RATE,
            n_fft=self.N_FFT,
            n_mels=self.N_MELS,
            f_min=20.0,
            f_max=self.TARGET_SAMPLE_RATE / 2.0,
        )

    def compute_stft(self, y: np.ndarray) -> np.ndarray:
        """Vectorized Short-Time Fourier Transform using Hann window."""
        window = np.hanning(self.N_FFT)
        num_frames = (len(y) - self.N_FFT) // self.HOP_LENGTH + 1
        frames = np.lib.stride_tricks.as_strided(
            y,
            shape=(num_frames, self.N_FFT),
            strides=(y.strides[0] * self.HOP_LENGTH, y.strides[0]),
        )
        windowed = frames * window
        fft_out = np.fft.rfft(windowed, n=self.N_FFT, axis=-1)
        # Power spectrogram shape: (num_bins, num_frames)
        power_spec = (np.abs(fft_out) ** 2).T.astype(np.float32)
        return power_spec

    def generate_log_mel_spectrogram(self, audio_samples: np.ndarray) -> np.ndarray:
        """
        Converts raw 1D float32 audio samples into a Log-Mel Spectrogram matrix.
        Output shape: (1, 128, 1292)
        """
        # Ensure 1D audio
        if audio_samples.ndim > 1:
            audio_samples = np.mean(audio_samples, axis=0)

        # Pad or truncate to target samples (30 seconds @ 22,050 Hz = 661,500 samples)
        if len(audio_samples) < self.TARGET_SAMPLES:
            padded = np.zeros(self.TARGET_SAMPLES, dtype=np.float32)
            padded[: len(audio_samples)] = audio_samples
            audio_samples = padded
        else:
            # Take the most energetic 30s segment or middle segment
            start = (len(audio_samples) - self.TARGET_SAMPLES) // 2
            audio_samples = audio_samples[start : start + self.TARGET_SAMPLES]

        # STFT power spectrum
        power_spec = self.compute_stft(audio_samples)

        # Mel filterbank projection: (128, bins) @ (bins, frames) -> (128, frames)
        mel_spec = np.dot(self.mel_fb, power_spec)

        # Log transform (log1p with eps=1e-6)
        eps = 1e-6
        log_mel = np.log(np.maximum(eps, mel_spec))

        # Ensure exact frame dimension of 1292
        current_frames = log_mel.shape[1]
        if current_frames < self.TARGET_FRAMES:
            pad_width = self.TARGET_FRAMES - current_frames
            log_mel = np.pad(log_mel, ((0, 0), (0, pad_width)), mode="edge")
        elif current_frames > self.TARGET_FRAMES:
            log_mel = log_mel[:, : self.TARGET_FRAMES]

        # Reshape to (1, 128, 1292)
        final_tensor = np.expand_dims(log_mel, axis=0).astype(np.float32)
        return final_tensor

    def save_to_npy_file(self, matrix: np.ndarray, output_path: str) -> str:
        """Saves matrix to .npy file."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        np.save(output_path, matrix)
        return output_path

    def to_npy_bytes(self, matrix: np.ndarray) -> bytes:
        """Serializes matrix to in-memory bytes."""
        buf = io.BytesIO()
        np.save(buf, matrix)
        return buf.getvalue()
