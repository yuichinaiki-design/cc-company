"""Deterministic prompt picker. Kept dep-free so it's trivially testable."""
from __future__ import annotations

from datetime import date


def pick_prompt(prompts: list[str], rotation_seed: str | None = None) -> str:
    if not prompts:
        raise ValueError("prompts list is empty")
    seed = rotation_seed or date.today().isoformat()
    idx = sum(ord(c) for c in seed) % len(prompts)
    return prompts[idx]
