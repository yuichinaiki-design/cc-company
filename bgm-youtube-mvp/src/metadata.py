"""Build YouTube title / description / tags from a prompt + template."""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date

from .config import YouTubeConfig


@dataclass
class VideoMeta:
    title: str
    description: str
    tags: list[str]


_TAG_STOPWORDS = {
    "with", "and", "the", "a", "an", "of", "in", "on", "for", "to",
    "bpm", "background",
}


def _short_prompt(prompt: str, max_len: int = 60) -> str:
    text = prompt.split(",")[0].strip()
    return text[: max_len - 1] + "…" if len(text) > max_len else text


def _tags_from_prompt(prompt: str) -> list[str]:
    words = re.findall(r"[A-Za-z][A-Za-z\-]+", prompt.lower())
    seen: list[str] = []
    for w in words:
        if w in _TAG_STOPWORDS or len(w) <= 2 or w in seen:
            continue
        seen.append(w)
    return seen[:15]


def build_meta(
    prompt: str,
    duration_min: int,
    channel_name: str,
    cfg: YouTubeConfig,
    today: date | None = None,
) -> VideoMeta:
    today = today or date.today()
    short = _short_prompt(prompt)
    fmt = {
        "prompt": prompt,
        "prompt_short": short,
        "date": today.isoformat(),
        "duration_min": duration_min,
        "channel": channel_name,
    }
    title = cfg.title_template.format(**fmt)
    if len(title) > 95:
        # YouTube hard cap is 100; keep margin.
        title = title[:94] + "…"
    description = cfg.description_template.format(**fmt)
    tags = list(dict.fromkeys([*cfg.base_tags, *_tags_from_prompt(prompt)]))
    # YouTube tag list <= 500 chars total.
    out: list[str] = []
    total = 0
    for t in tags:
        if total + len(t) + 1 > 480:
            break
        out.append(t)
        total += len(t) + 1
    return VideoMeta(title=title, description=description, tags=out)
