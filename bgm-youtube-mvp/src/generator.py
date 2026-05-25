"""BGM generation via MusicGen, using HuggingFace transformers.

We use `transformers` rather than the standalone `audiocraft` package because
audiocraft's build chain is fragile against modern setuptools / torch combos.
The model weights are identical (Meta MusicGen on the HuggingFace hub).

We generate N short clips, then concatenate them with short crossfades into
a single seed track. The video module later loops this seed track until the
target duration is reached.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
from pydub import AudioSegment
from transformers import AutoProcessor, MusicgenForConditionalGeneration

from .config import GenerationConfig
from .logger import get_logger

log = get_logger()


def _pick_device(requested: str) -> str:
    if requested == "cuda" and torch.cuda.is_available():
        return "cuda"
    if requested == "mps" and getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    if requested in {"cuda", "mps"}:
        log.warning("device=%s not available, falling back to cpu", requested)
    return "cpu"


def _array_to_segment(arr: np.ndarray, sample_rate: int) -> AudioSegment:
    """Convert a (channels?, samples) float array to a pydub AudioSegment."""
    if arr.ndim == 1:
        arr = arr[np.newaxis, :]
    arr = np.clip(arr, -1.0, 1.0)
    int16 = (arr * 32767.0).astype(np.int16)
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


def _seconds_to_tokens(seconds: int, frame_rate: int) -> int:
    """MusicGen generates audio tokens at a fixed frame rate (~50 Hz for small)."""
    return max(1, int(seconds * frame_rate))


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

    processor = AutoProcessor.from_pretrained(cfg.model)
    model = MusicgenForConditionalGeneration.from_pretrained(cfg.model).to(device)
    model.eval()

    sample_rate = model.config.audio_encoder.sampling_rate
    frame_rate = model.config.audio_encoder.frame_rate
    max_new_tokens = _seconds_to_tokens(cfg.clip_seconds, frame_rate)

    n = max(1, cfg.clips_per_video)
    log.info(
        "generating %d clip(s) of ~%ds each (max_new_tokens=%d) for prompt=%r",
        n,
        cfg.clip_seconds,
        max_new_tokens,
        prompt,
    )

    segments: list[AudioSegment] = []
    for i in range(n):
        log.info("  clip %d/%d", i + 1, n)
        inputs = processor(text=[prompt], padding=True, return_tensors="pt").to(device)
        with torch.inference_mode():
            audio_values = model.generate(
                **inputs,
                do_sample=True,
                guidance_scale=cfg.cfg_coef,
                max_new_tokens=max_new_tokens,
                temperature=cfg.temperature,
                top_k=cfg.top_k,
                top_p=cfg.top_p if cfg.top_p > 0 else 1.0,
            )
        # audio_values: (batch, channels, samples) float in [-1, 1]
        arr = audio_values[0].detach().cpu().numpy()
        seg = _array_to_segment(arr, sample_rate)
        segments.append(seg)

    combined = segments[0]
    for seg in segments[1:]:
        combined = combined.append(seg, crossfade=min(crossfade_ms, len(seg) // 2))

    combined.export(out_path, format="wav")
    log.info("wrote seed track %s (%.1fs)", out_path, combined.duration_seconds)
    return out_path
