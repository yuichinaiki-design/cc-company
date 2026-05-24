"""Upload a video to YouTube using the Data API v3."""
from __future__ import annotations

from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from tenacity import retry, stop_after_attempt, wait_exponential

from .config import YouTubeConfig
from .logger import get_logger
from .metadata import VideoMeta

log = get_logger()

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def get_credentials(client_secrets: str, token_file: str) -> Credentials:
    token_path = Path(token_file)
    creds: Credentials | None = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    if creds and creds.valid:
        return creds
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        token_path.write_text(creds.to_json())
        return creds
    if not Path(client_secrets).exists():
        raise FileNotFoundError(
            f"client secrets not found at {client_secrets}. "
            "Create OAuth credentials in Google Cloud Console and download the JSON."
        )
    flow = InstalledAppFlow.from_client_secrets_file(client_secrets, SCOPES)
    # run_local_server opens a browser; on a headless box use run_console().
    creds = flow.run_local_server(port=0)
    token_path.write_text(creds.to_json())
    return creds


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=30))
def upload_video(
    video_path: Path,
    meta: VideoMeta,
    cfg: YouTubeConfig,
    client_secrets: str,
    token_file: str,
) -> str:
    """Upload and return the resulting YouTube video ID."""
    creds = get_credentials(client_secrets, token_file)
    youtube = build("youtube", "v3", credentials=creds, cache_discovery=False)

    body = {
        "snippet": {
            "title": meta.title,
            "description": meta.description,
            "tags": meta.tags,
            "categoryId": cfg.category_id,
        },
        "status": {
            "privacyStatus": cfg.privacy,
            "selfDeclaredMadeForKids": cfg.made_for_kids,
            "embeddable": True,
            "license": "youtube",
        },
    }

    media = MediaFileUpload(
        str(video_path),
        mimetype="video/mp4",
        chunksize=8 * 1024 * 1024,
        resumable=True,
    )
    log.info("starting upload: %s (%.1f MB)", video_path, video_path.stat().st_size / 1e6)
    request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    response = None
    try:
        while response is None:
            status, response = request.next_chunk()
            if status:
                log.info("  upload progress: %d%%", int(status.progress() * 100))
    except HttpError as e:
        log.error("upload failed: %s", e)
        raise

    video_id = response["id"]
    log.info("upload complete: https://youtu.be/%s", video_id)
    return video_id
