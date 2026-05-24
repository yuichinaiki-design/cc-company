"""End-to-end daily pipeline: pick prompt -> generate -> render -> upload."""
from __future__ import annotations

import argparse
import json
import time
from datetime import date, datetime
from pathlib import Path

from .config import AppConfig, load_config, load_prompts
from .generator import generate_seed_track
from .logger import get_logger
from .metadata import build_meta
from .rotation import pick_prompt
from .video import build_video
from .youtube import upload_video

log = get_logger()

OUTPUT_ROOT = Path("./output")
HISTORY_FILE = OUTPUT_ROOT / "history.jsonl"


def append_history(entry: dict) -> None:
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    with HISTORY_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def run_once(cfg: AppConfig, prompt_override: str | None = None, skip_upload: bool = False) -> dict:
    prompts = load_prompts(cfg.prompts_file)
    prompt = prompt_override or pick_prompt(prompts)
    log.info("today's prompt: %s", prompt)

    today = date.today().isoformat()
    run_id = datetime.now().strftime("%Y%m%d-%H%M%S")
    work_dir = OUTPUT_ROOT / today / run_id
    work_dir.mkdir(parents=True, exist_ok=True)

    # 1. generate seed audio
    seed_wav = work_dir / "seed.wav"
    generate_seed_track(prompt, cfg.generation, cfg.device, seed_wav)
    time.sleep(cfg.pacing_seconds)

    # 2. assemble final video
    video_path = build_video(seed_wav, cfg.video, work_dir, basename=run_id)
    time.sleep(cfg.pacing_seconds)

    # 3. build metadata
    meta = build_meta(
        prompt=prompt,
        duration_min=cfg.video.target_minutes,
        channel_name=cfg.channel_name,
        cfg=cfg.youtube,
    )
    (work_dir / "metadata.json").write_text(
        json.dumps(
            {"title": meta.title, "description": meta.description, "tags": meta.tags},
            ensure_ascii=False,
            indent=2,
        )
    )

    # 4. upload (optional)
    video_id: str | None = None
    if not skip_upload:
        video_id = upload_video(
            video_path=video_path,
            meta=meta,
            cfg=cfg.youtube,
            client_secrets=cfg.youtube_client_secrets,
            token_file=cfg.youtube_token_file,
        )

    entry = {
        "run_id": run_id,
        "date": today,
        "prompt": prompt,
        "title": meta.title,
        "video_path": str(video_path),
        "youtube_id": video_id,
        "uploaded": video_id is not None,
    }
    append_history(entry)
    log.info("done: %s", entry)
    return entry


def main() -> None:
    parser = argparse.ArgumentParser(description="Daily BGM -> YouTube pipeline")
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--prompt", default=None, help="override today's prompt")
    parser.add_argument(
        "--no-upload",
        action="store_true",
        help="generate the video but skip the YouTube upload",
    )
    args = parser.parse_args()

    cfg = load_config(args.config)
    run_once(cfg, prompt_override=args.prompt, skip_upload=args.no_upload)


if __name__ == "__main__":
    main()
