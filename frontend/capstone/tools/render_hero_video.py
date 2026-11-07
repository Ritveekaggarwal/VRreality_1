"""Renders the hero background: an original, perfectly looping DNA helix.

Every motion completes a whole number of cycles over the clip, so the last frame
flows straight into the first with no visible seam.

Usage: pip install numpy pillow imageio-ffmpeg
       python tools/render_hero_video.py
"""
import math
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image

W, H, FPS, SECONDS = 1280, 720, 24, 12
FRAMES = FPS * SECONDS
OUT = Path(__file__).resolve().parent.parent / "public" / "media"

TEAL = np.array([0.24, 0.86, 0.76], dtype=np.float32)
AMBER = np.array([1.0, 0.71, 0.28], dtype=np.float32)
MIST = np.array([0.55, 0.85, 0.85], dtype=np.float32)

rng = np.random.default_rng(7)


def background() -> np.ndarray:
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    base = np.zeros((H, W, 3), dtype=np.float32)
    base[..., 0], base[..., 1], base[..., 2] = 0.024, 0.078, 0.106
    glow = np.exp(-(((x - W * 0.72) / (W * 0.42)) ** 2 + ((y - H * 0.45) / (H * 0.62)) ** 2))
    base += glow[..., None] * np.array([0.02, 0.11, 0.12], dtype=np.float32)
    return base


def sprite(radius: int, softness: float) -> np.ndarray:
    span = np.arange(-radius, radius + 1, dtype=np.float32)
    xx, yy = np.meshgrid(span, span)
    distance = np.sqrt(xx**2 + yy**2) / radius
    return np.clip(np.exp(-((distance / softness) ** 2)) - 0.012, 0, 1)


SPRITES = {r: sprite(r, 0.5) for r in range(2, 72)}


def stamp(canvas, x, y, radius, color, strength):
    radius = int(min(max(radius, 2), 71))
    shape = SPRITES[radius]
    x, y = int(x), int(y)
    x0, x1 = max(x - radius, 0), min(x + radius + 1, W)
    y0, y1 = max(y - radius, 0), min(y + radius + 1, H)
    if x0 >= x1 or y0 >= y1:
        return
    part = shape[y0 - y + radius : y1 - y + radius, x0 - x + radius : x1 - x + radius]
    canvas[y0:y1, x0:x1] += part[..., None] * (color * strength)


# Drifting motes. Each wraps a whole number of times per loop.
MOTES = [
    {
        "x": rng.uniform(0, W),
        "y": rng.uniform(0, H),
        "laps": int(rng.integers(1, 3)),
        "sway": rng.uniform(8, 34),
        "phase": rng.uniform(0, math.tau),
        "size": rng.uniform(3, 15),
        "glow": rng.uniform(0.05, 0.22),
        "color": AMBER if rng.random() < 0.18 else MIST,
    }
    for _ in range(80)
]

TILT = math.radians(-24)
CENTER_X, CENTER_Y = W * 0.70, H * 0.5
PITCH = 300.0  # pixels per full helix turn
AMPLITUDE = 118.0
SPAN = 1300.0
TURNS_PER_LOOP = 2


def project(along, angle):
    """Maps a point on the helix to screen position and depth (0 far, 1 near)."""
    across = AMPLITUDE * math.sin(angle)
    depth = (math.cos(angle) + 1) / 2
    x = CENTER_X + along * math.sin(TILT) * -1 + across * math.cos(TILT)
    y = CENTER_Y + along * math.cos(TILT) + across * math.sin(TILT)
    return x, y, depth


def draw_helix(canvas, spin):
    items = []
    node_step = 6.0
    for along in np.arange(-SPAN / 2, SPAN / 2, node_step):
        base = along / PITCH * math.tau + spin
        for offset, color in ((0.0, TEAL), (math.pi, AMBER)):
            x, y, depth = project(along, base + offset)
            items.append((depth, x, y, 5 + depth * 8, color, 0.2 + depth * 0.3))

    rung_step = PITCH / 12
    first = math.floor(-SPAN / 2 / rung_step) * rung_step
    for along in np.arange(first, SPAN / 2, rung_step):
        base = along / PITCH * math.tau + spin
        ax, ay, ad = project(along, base)
        bx, by, bd = project(along, base + math.pi)
        for t in np.linspace(0.08, 0.92, 15):
            depth = ad + (bd - ad) * t
            color = TEAL + (AMBER - TEAL) * t
            items.append(
                (depth - 0.01, ax + (bx - ax) * t, ay + (by - ay) * t, 4 + depth * 3, color, 0.13 + depth * 0.16)
            )

    items.sort(key=lambda item: item[0])
    for _, x, y, radius, color, strength in items:
        stamp(canvas, x, y, radius, color, strength)
        if strength > 0.4:
            stamp(canvas, x, y, radius * 3.2, color, 0.022)


def draw_motes(canvas, progress):
    for mote in MOTES:
        wrapped = (mote["y"] - progress * mote["laps"] * (H + 80)) % (H + 80) - 40
        x = mote["x"] + mote["sway"] * math.sin(progress * math.tau + mote["phase"])
        twinkle = 0.65 + 0.35 * math.sin(progress * math.tau * 2 + mote["phase"])
        stamp(canvas, x, wrapped, mote["size"], mote["color"], mote["glow"] * twinkle)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    raw = OUT / "_frames.raw"
    base = background()

    # A soft dither stops the dark gradient banding after compression.
    grain = rng.normal(0, 0.006, (H, W, 1)).astype(np.float32)

    with open(raw, "wb") as file:
        for frame in range(FRAMES):
            progress = frame / FRAMES
            canvas = base.copy()
            draw_motes(canvas, progress)
            draw_helix(canvas, progress * math.tau * TURNS_PER_LOOP)
            mapped = 1 - np.exp(-canvas * 1.7)  # tone map so bright overlaps do not clip
            image = np.clip((mapped + grain) * 255, 0, 255).astype(np.uint8)
            file.write(image.tobytes())
            if frame == FRAMES // 3:
                Image.fromarray(image).save(OUT / "hero-poster.jpg", quality=82)

    source = [
        ffmpeg, "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
        "-i", str(raw),
    ]
    subprocess.run(
        source + ["-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p",
                  "-movflags", "+faststart", "-an", str(OUT / "hero-loop.mp4")],
        check=True,
    )
    raw.unlink()
    for file in OUT.iterdir():
        print(file.name, round(file.stat().st_size / 1024), "KB")


if __name__ == "__main__":
    main()
