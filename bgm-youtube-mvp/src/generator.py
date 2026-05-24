"""BGM generation via MusicGen (Meta / audiocraft).

We generate N short clips (<=30s each, the model's hard cap), then concatenate
them with short crossfades into a single seed track. The video module later
loops this seed track until the target duration is reached.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
from audiocraft.models import MusicGen
from pydub import AudioSegment

from .config import GenerationConfig
from .logger import get_logger

log = get_logger()


def _pick_device(requested: str) -> str:
    if requested == "cuda" and torch.cuda.is_available():
        return "cuda"
    if requested == "mps" and torch.backends.mps.is_available():
        return "mps"
    if requested in {"cuda", "mps"}:
        log.warning("device=%s not available, falling back to cpu", requested)
    return "cpu"


def _tensor_to_segment(wav: torch.Tensor, sample_rate: int) -> AudioSegment:
    """Convert a (channels, samples) float tensor to a pydub AudioSegment."""
    arr = wav.detach().cpu().numpy()
    if arr.ndim == 1:
        arr = arr[np.newaxis, :]
    # MusicGen output is float32 in [-1, 1].
    arr = np.clip(arr, -1.0, 1.0)
    int16 = (arr * 32767.0).astype(np.int16)
    # pydub expects interleaved bytes per sample.
    if int16.shape[0] == 1:
        interleaved = int16[0]
        channels = 1
    else:
        interleaved = int16.T.reshape(-1)
        channels = int16.shape[0]
    return AudioSegment(
        interleaved.tobytes(),
        frame_rate=sample_rate,
        sample_width=2,
        channels=channels,
    )


def generate_seed_track(
    prompt: str,
    cfg: GenerationConfig,
    device: str,
    out_path: str | Path,
    crossfade_ms: int = 500,
) -> Path:
    """Generate clips for the given prompt and stitch them into one wav file."""
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    device = _pick_device(device)
    log.info("loading MusicGen model=%s on device=%s", cfg.model, device)
    model = MusicGen.get_pretrained(cfg.model, device=device)
    model.set_generation_params(
        duration=cfg.clip_seconds,
        temperature=cfg.temperature,
        top_k=cfg.top_k,
        top_p=cfg.top_p,
        cfg_coef=cfg.cfg_coef,
    )

    n = max(1, cfg.clips_per_video)
    log.info(
        "generating %d clip(s) of %ds each for prompt=%r",
        n,
        cfg.clip_seconds,
        prompt,
    )
    # Generate sequentially to keep VRAM bounded.
    segments: list[AudioSegment] = []
    for i in range(n):
        log.info("  clip %d/%d", i + 1, n)
        wav = model.generate([prompt])  # (batch=1, channels, samples)
        seg = _tensor_to_segment(wav[0], model.sample_rate)
        segments.append(seg)

    combined = segments[0]
    for seg in segments[1:]:
        combined = combined.append(seg, crossfade=min(crossfade_ms, len(seg) // 2))

    combined.export(out_path, format="wav")
    log.info("wrote seed track %s (%.1fs)", out_path, combined.duration_seconds)
    return out_path
