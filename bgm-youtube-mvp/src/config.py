"""Load YAML config + .env into a single typed-ish object."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv


@dataclass
class GenerationConfig:
    model: str = "facebook/musicgen-medium"
    clip_seconds: int = 30
    clips_per_video: int = 4
    temperature: float = 1.0
    top_k: int = 250
    top_p: float = 0.0
    cfg_coef: float = 3.0


@dataclass
class VideoConfig:
    target_minutes: int = 60
    loop_crossfade_ms: int = 2000
    width: int = 1920
    height: int = 1080
    fps: int = 2
    background_image: str = "./assets/background.jpg"
    background_color: str = "#0b1020"


@dataclass
class YouTubeConfig:
    privacy: str = "private"
    category_id: str = "10"
    made_for_kids: bool = False
    base_tags: list[str] = field(default_factory=list)
    title_template: str = "[{duration_min}min] {prompt_short} - {channel}"
    description_template: str = "{prompt}"


@dataclass
class AppConfig:
    generation: GenerationConfig
    video: VideoConfig
    youtube: YouTubeConfig
    prompts_file: str
    pacing_seconds: int = 2

    # env-derived
    device: str = "cuda"
    channel_name: str = "BGM Studio"
    youtube_client_secrets: str = "./client_secret.json"
    youtube_token_file: str = "./token.json"
    youtube_privacy_env: str | None = None


def _section(raw: dict[str, Any], key: str) -> dict[str, Any]:
    section = raw.get(key) or {}
    if not isinstance(section, dict):
        raise ValueError(f"config section '{key}' must be a mapping")
    return section


def load_config(path: str | Path = "config.yaml") -> AppConfig:
    load_dotenv()

    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"config not found: {path}")
    raw = yaml.safe_load(path.read_text()) or {}

    cfg = AppConfig(
        generation=GenerationConfig(**_section(raw, "generation")),
        video=VideoConfig(**_section(raw, "video")),
        youtube=YouTubeConfig(**_section(raw, "youtube")),
        prompts_file=raw.get("prompts_file", "./prompts/prompts.txt"),
        pacing_seconds=int(raw.get("pacing_seconds", 2)),
        device=os.getenv("DEVICE", "cuda"),
        channel_name=os.getenv("CHANNEL_NAME", "BGM Studio"),
        youtube_client_secrets=os.getenv(
            "YOUTUBE_CLIENT_SECRETS", "./client_secret.json"
        ),
        youtube_token_file=os.getenv("YOUTUBE_TOKEN_FILE", "./token.json"),
        youtube_privacy_env=os.getenv("YOUTUBE_PRIVACY"),
    )
    # env overrides yaml for privacy if set
    if cfg.youtube_privacy_env:
        cfg.youtube.privacy = cfg.youtube_privacy_env
    return cfg


def load_prompts(path: str | Path) -> list[str]:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"prompts file not found: {p}")
    lines = [
        line.strip()
        for line in p.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    if not lines:
        raise ValueError(f"no usable prompts in {p}")
    return lines
