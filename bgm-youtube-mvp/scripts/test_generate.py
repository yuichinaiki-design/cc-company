"""Smoke test: generate a 30s clip and assemble a 1-minute video, no upload."""
from __future__ import annotations

from src.config import load_config
from src.pipeline import run_once


def main() -> None:
    cfg = load_config()
    # tiny override for fast iteration
    cfg.generation.clips_per_video = 1
    cfg.video.target_minutes = 1
    run_once(cfg, prompt_override="lofi hip hop, mellow piano, 75 bpm", skip_upload=True)


if __name__ == "__main__":
    main()
