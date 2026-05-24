"""One-shot helper to perform the OAuth dance and cache the YouTube token.

Run on a machine with a browser:
    python -m scripts.auth_youtube

After this, token.json exists and the pipeline can upload non-interactively.
"""
from __future__ import annotations

from src.config import load_config
from src.youtube import get_credentials


def main() -> None:
    cfg = load_config()
    creds = get_credentials(cfg.youtube_client_secrets, cfg.youtube_token_file)
    print("OK. token cached at:", cfg.youtube_token_file)
    print("token expiry:", creds.expiry)


if __name__ == "__main__":
    main()
