"""Tiny logging helper shared across modules."""
from __future__ import annotations

import logging
import sys

_LOGGER: logging.Logger | None = None


def get_logger(name: str = "bgm") -> logging.Logger:
    global _LOGGER
    if _LOGGER is not None:
        return _LOGGER
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    )
    logger.addHandler(handler)
    logger.propagate = False
    _LOGGER = logger
    return logger
