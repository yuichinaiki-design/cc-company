"""Pure-Python tests that don't require GPU / network."""
from __future__ import annotations

from datetime import date

from src.config import YouTubeConfig
from src.metadata import build_meta
from src.rotation import pick_prompt


def test_pick_prompt_is_deterministic_per_day() -> None:
    prompts = ["a", "b", "c", "d"]
    assert pick_prompt(prompts, "2026-05-24") == pick_prompt(prompts, "2026-05-24")
    # different seeds usually land on different prompts
    seeds = {pick_prompt(prompts, f"2026-05-{d:02d}") for d in range(1, 10)}
    assert len(seeds) > 1


def test_build_meta_respects_limits() -> None:
    cfg = YouTubeConfig(
        base_tags=["lofi", "study", "bgm"],
        title_template="[{duration_min}min] {prompt_short} - {channel}",
        description_template="{prompt}\n\n#{channel}",
    )
    meta = build_meta(
        prompt="lofi hip hop beat, mellow piano, soft vinyl crackle, 75 bpm, late night study vibe",
        duration_min=60,
        channel_name="Lofi Loop Studio",
        cfg=cfg,
        today=date(2026, 5, 24),
    )
    assert meta.title.startswith("[60min]")
    assert len(meta.title) <= 95
    assert "lofi" in meta.tags
    # tag list stays under 480 chars total (well below YT's 500 cap)
    assert sum(len(t) + 1 for t in meta.tags) <= 480


def test_build_meta_truncates_long_titles() -> None:
    cfg = YouTubeConfig(
        base_tags=[],
        title_template="{prompt_short} " + ("x" * 200),
    )
    meta = build_meta("a calm prompt", 60, "Chan", cfg)
    assert len(meta.title) <= 95
