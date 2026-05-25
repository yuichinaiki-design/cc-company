"""Video pipeline smoke test that does NOT need MusicGen / GPU.

Generates a short sine-wave WAV, then runs `build_video` to produce an MP4.
Useful for verifying ffmpeg + moviepy + Pillow are wired correctly on a box
before paying the MusicGen install/runtime cost.

    python -m scripts.video_only_demo
"""
from __future__ import annotations

import math
import wave
from pathlib import Path

from src.config import load_config
from src.video import build_video


def _write_sine_wav(path: Path, seconds: float = 3.0, freq: float = 220.0, sr: int = 32000) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    n = int(seconds * sr)
    amp = 0.3 * 32767
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        for i in range(n):
            s = int(amp * math.sin(2 * math.pi * freq * i / sr))
            w.writeframesraw(s.to_bytes(2, "little", signed=True))


def main() -> None:
    cfg = load_config("config.cpu.yaml")
    # Force a tiny render so this finishes in a few seconds.
    cfg.video.target_minutes = 0  # we'll override below
    out_dir = Path("./output/video_only_demo")
    seed = out_dir / "seed.wav"
    _write_sine_wav(seed, seconds=3.0)
    # Bypass target_minutes scaling: write a 6s video by setting target to 0.1 min.
    cfg.video.target_minutes = 1
    build_video(seed, cfg.video, out_dir, basename="demo")
    print("wrote:", out_dir / "demo.mp4")


if __name__ == "__main__":
    main()
