"""
CloudiAudi Deep Acoustic CNN Feature Extractor (PyTorch).
Extracts:
1. 256-dimensional L2-normalized acoustic embedding vector
2. Continuous BPM estimation (regression)
3. 24 Musical Key classification (12 Major, 12 Minor)
4. 10-dimensional multi-label mood profile (Sigmoid)
"""

from __future__ import annotations

from typing import Any, Dict, List, Tuple
import torch
import torch.nn as nn
import torch.nn.functional as F


# 24 Musical Keys in Standard Camelot / Circle of Fifths Notation
MUSICAL_KEYS: List[str] = [
    "C Major", "C Minor",
    "C# Major", "C# Minor",
    "D Major", "D Minor",
    "D# Major", "D# Minor",
    "E Major", "E Minor",
    "F Major", "F Minor",
    "F# Major", "F# Minor",
    "G Major", "G Minor",
    "G# Major", "G# Minor",
    "A Major", "A Minor",
    "A# Major", "A# Minor",
    "B Major", "B Minor",
]

MOOD_TAGS: List[str] = [
    "dark",
    "energetic",
    "chill",
    "melancholic",
    "aggressive",
    "euphoric",
    "romantic",
    "bouncy",
    "trap",
    "soulful",
]


class ConvBlock(nn.Module):
    """Convolutional block: Conv2d -> BatchNorm2d -> ELU -> MaxPool2d -> Dropout."""

    def __init__(self, in_channels: int, out_channels: int, dropout_p: float = 0.20):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False)
        self.bn = nn.BatchNorm2d(out_channels)
        self.act = nn.ELU(alpha=1.0)
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)
        self.drop = nn.Dropout2d(p=dropout_p)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.conv(x)
        x = self.bn(x)
        x = self.act(x)
        x = self.pool(x)
        x = self.drop(x)
        return x


class CloudiAudiFeatureExtractor(nn.Module):
    """
    Multi-Task Deep Convolutional Audio Neural Network.
    Accepts Log-Mel Spectrogram inputs of shape (B, 1, 128, 1292).
    Outputs:
    - Normalized 256-d embedding
    - Predicted BPM
    - Key classification logits (24 classes)
    - Mood probabilities (10 classes)
    """

    def __init__(self, embedding_dim: int = 256):
        super().__init__()
        self.embedding_dim = embedding_dim

        # 4 Convolutional Feature Extraction Blocks
        self.block1 = ConvBlock(1, 32, dropout_p=0.10)
        self.block2 = ConvBlock(32, 64, dropout_p=0.15)
        self.block3 = ConvBlock(64, 128, dropout_p=0.20)
        self.block4 = ConvBlock(128, 256, dropout_p=0.25)

        # Global Average Pooling
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))

        # Acoustic Embedding Projection Layer
        self.proj_fc = nn.Linear(256, embedding_dim)

        # Multi-Task Head 1: BPM Regression
        self.bpm_head = nn.Sequential(
            nn.Linear(256, 64),
            nn.ELU(),
            nn.Linear(64, 1),
            nn.Softplus(),
        )

        # Multi-Task Head 2: Musical Key Classification (24 classes)
        self.key_head = nn.Sequential(
            nn.Linear(256, 128),
            nn.ELU(),
            nn.Dropout(p=0.2),
            nn.Linear(128, 24),
        )

        # Multi-Task Head 3: Multi-Label Mood Profile (10 classes)
        self.mood_head = nn.Sequential(
            nn.Linear(256, 128),
            nn.ELU(),
            nn.Dropout(p=0.2),
            nn.Linear(128, 10),
        )

    def forward(
        self, x: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Forward pass.
        Returns:
            embedding: (B, 256) L2-normalized vector
            bpm: (B, 1) continuous float BPM
            key_logits: (B, 24) musical key logits
            mood_logits: (B, 10) mood classification logits
        """
        # Feature hierarchy
        x = self.block1(x)
        x = self.block2(x)
        x = self.block3(x)
        x = self.block4(x)  # (B, 256, H', W')

        # Global pooling: (B, 256, 1, 1) -> (B, 256)
        features = self.global_pool(x).view(x.size(0), -1)

        # 1. 256-dim acoustic embedding with L2 normalization
        projected = self.proj_fc(features)
        embedding = F.normalize(projected, p=2, dim=1)

        # 2. BPM estimation: softplus base scaled into range [40, 220]
        raw_bpm = self.bpm_head(features)
        bpm = 40.0 + raw_bpm * 25.0

        # 3. Key logits
        key_logits = self.key_head(features)

        # 4. Mood logits
        mood_logits = self.mood_head(features)

        return embedding, bpm, key_logits, mood_logits

    @torch.no_grad()
    def extract_track_features(self, spectrogram_tensor: torch.Tensor) -> Dict[str, Any]:
        """
        Inference helper to process a single or batch of spectrograms into python types.
        Input shape: (1, 128, 1292) or (1, 1, 128, 1292).
        """
        self.eval()
        if spectrogram_tensor.ndim == 3:
            spectrogram_tensor = spectrogram_tensor.unsqueeze(0)

        emb, bpm_pred, key_logits, mood_logits = self(spectrogram_tensor)

        emb_list = [float(round(val, 6)) for val in emb[0].cpu().numpy().tolist()]
        bpm_val = float(round(bpm_pred[0].item(), 1))

        key_probs = F.softmax(key_logits[0], dim=0)
        best_key_idx = int(torch.argmax(key_probs).item())
        best_key_label = MUSICAL_KEYS[best_key_idx]
        key_conf = float(round(key_probs[best_key_idx].item(), 4))

        mood_probs = torch.sigmoid(mood_logits[0])
        mood_dict = {}
        for idx, tag in enumerate(MOOD_TAGS):
            mood_dict[tag] = float(round(mood_probs[idx].item(), 4))

        return {
            "embedding": emb_list,
            "bpm": bpm_val,
            "musical_key": best_key_label,
            "key_confidence": key_conf,
            "mood_profile": mood_dict,
        }
