"""Loop the seed audio to a target length and wrap it in an MP4 with a still image."""
from __future__ import annotations

from pathlib import Path

from moviepy.editor import AudioFileClip, ImageClip
from PIL import Image, ImageDraw, ImageFont
from pydub import AudioSegment

from .config import VideoConfig
from .logger import get_logger

log = get_logger()


def _ensure_background(cfg: VideoConfig, out_path: Path) -> Path:
    """Return a path to a usable background image; generate a solid one if missing."""
    src = Path(cfg.background_image)
    if src.exists():
        return src
    log.info("background image %s missing, generating a solid one", src)
    img = Image.new("RGB", (cfg.width, cfg.height), cfg.background_color)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
    except OSError:
        font = ImageFont.load_default()
    label = "BGM"
    bbox = draw.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((cfg.width - tw) / 2, (cfg.height - th) / 2), label, fill="white", font=font)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "JPEG", quality=90)
    return out_path


def _loop_audio(seed_wav: Path, target_seconds: int, crossfade_ms: int, out_path: Path) -> Path:
    """Loop the seed audio with crossfades until target_seconds is reached."""
    seed = AudioSegment.from_file(seed_wav)
    if len(seed) == 0:
        raise ValueError(f"seed audio is empty: {seed_wav}")

    target_ms = target_seconds * 1000
    safe_crossfade = max(0, min(crossfade_ms, len(seed) // 4))

    combined = seed
    while len(combined) < target_ms:
        combined = combined.append(seed, crossfade=safe_crossfade)
    combined = combined[:target_ms]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    combined.export(out_path, format="wav")
    log.info("looped audio to %.1fs -> %s", combined.duration_seconds, out_path)
    return out_path


def build_video(
    seed_wav: Path,
    cfg: VideoConfig,
    out_dir: Path,
    basename: str,
) -> Path:
    """Produce <out_dir>/<basename>.mp4 from the seed wav."""
    out_dir.mkdir(parents=True, exist_ok=True)

    bg_path = _ensure_background(cfg, out_dir / "background.jpg")
    full_wav = _loop_audio(
        seed_wav,
        cfg.target_minutes * 60,
        cfg.loop_crossfade_ms,
        out_dir / f"{basename}.full.wav",
    )

    audio_clip = AudioFileClip(str(full_wav))
    image_clip = (
        ImageClip(str(bg_path))
        .set_duration(audio_clip.duration)
        .resize((cfg.width, cfg.height))
        .set_fps(cfg.fps)
    )
    video_clip = image_clip.set_audio(audio_clip)

    out_path = out_dir / f"{basename}.mp4"
    log.info("rendering %s (%.1f min)", out_path, audio_clip.duration / 60)
    video_clip.write_videofile(
        str(out_path),
        codec="libx264",
        audio_codec="aac",
        fps=cfg.fps,
        preset="medium",
        threads=2,
        ffmpeg_params=["-pix_fmt", "yuv420p", "-tune", "stillimage"],
        verbose=False,
        logger=None,
    )
    audio_clip.close()
    video_clip.close()
    return out_path
