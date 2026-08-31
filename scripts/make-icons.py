#!/usr/bin/env python3
"""
Render public/favicon.ico, public/favicon.png and public/apple-touch-icon.png from
src/assets/logo-colored.png. Idempotent: re-running reproduces the committed files
byte for byte.

Run:
  pip install pillow
  python scripts/make-icons.py

One mark at every size: the lockup from the navbar - map outline, ELECTRIFYING THE
U.S., the three vehicles. Brand consistency is the point, so it is used even at the
sizes where it does not fully resolve. Be aware of what that costs: the map outline
is a hairline stroke and the wordmark is text, so 64 and up are clean, 48 is soft,
and 32 and 16 read as a blue smudge with a green core rather than as a map. 16 is
the size a browser tab draws, so that is what a tab shows.

If legibility at tab size ever matters more than consistency, the alternative is a
filled silhouette of the same map path - see 9d516f5, which shipped exactly that.
"""
import io
import struct
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "assets" / "logo-colored.png"
OUT = ROOT / "public"

WHITE = (255, 255, 255)

# The lockup without the ElectrifyingTheUS.com line, which is the crop that makes
# the mark legible small. Full resolution, so 256 is never upscaled.
LOCKUP_BOX = (75, 255, 1488, 1137)

# The lockup is wide, so fitting it to the tile width leaves the square
# letterboxed. Give it as much width as possible - it needs every pixel.
PAD = 0.98

# Sharpening for the sizes with no pixels to spare. The 8x box average is correct
# but soft; below 64 the coastline is a gradient rather than an edge without this.
# 2.6 is measured against 1.0 / 1.8 / 3.4 - it is the most contrast at 16 and 32
# before the outline starts breaking into speckle.
SHARPEN = {16: 2.6, 32: 2.6, 48: 2.0}

ICO_SIZES = [16, 32, 48, 64, 128, 256]


def flatten(im):
    """Composite onto white. Browsers do this anyway, and the map is white inside."""
    im = im.convert("RGBA")
    ground = Image.new("RGBA", im.size, WHITE + (255,))
    ground.alpha_composite(im)
    return ground.convert("RGB")


LOCKUP = flatten(Image.open(SRC).crop(LOCKUP_BOX))


def tile(size):
    """One icon, supersampled 8x so edges antialias before the reduction."""
    n = size * 8
    canvas = Image.new("RGB", (n, n), WHITE)
    tw = int(n * PAD)
    th = max(1, int(tw * LOCKUP.height / LOCKUP.width))
    canvas.paste(LOCKUP.resize((tw, th), Image.LANCZOS), ((n - tw) // 2, (n - th) // 2))
    # BOX at an exact 8x reduction is a true area average - no Lanczos ringing,
    # which at the small sizes smeared the outline into a halo.
    icon = canvas.resize((size, size), Image.BOX)
    if size in SHARPEN:
        icon = ImageEnhance.Sharpness(icon).enhance(SHARPEN[size])
    return icon


def write_ico(path, sizes):
    """Multi-size ICO with PNG payloads, which is what browsers and Windows read."""
    payloads = []
    for s in sizes:
        buf = io.BytesIO()
        tile(s).convert("RGBA").save(buf, format="PNG", optimize=True)
        payloads.append(buf.getvalue())
    header = struct.pack("<HHH", 0, 1, len(sizes))
    offset = len(header) + 16 * len(sizes)
    entries = b""
    for s, data in zip(sizes, payloads):
        entries += struct.pack("<BBBBHHII", s % 256, s % 256, 0, 0, 1, 32,
                               len(data), offset)
        offset += len(data)
    path.write_bytes(header + entries + b"".join(payloads))


if __name__ == "__main__":
    write_ico(OUT / "favicon.ico", ICO_SIZES)
    tile(480).save(OUT / "favicon.png", optimize=True)
    tile(180).save(OUT / "apple-touch-icon.png", optimize=True)
    for name in ("favicon.ico", "favicon.png", "apple-touch-icon.png"):
        print("wrote public/%s (%d bytes)" % (name, (OUT / name).stat().st_size))
