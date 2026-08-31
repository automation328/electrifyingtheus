#!/usr/bin/env python3
"""
Render public/favicon.ico, public/favicon.png and public/apple-touch-icon.png from
src/assets/logo-colored.png. Idempotent: re-running reproduces the committed files
byte for byte.

Run:
  pip install pillow numpy
  python scripts/make-icons.py

Two marks, chosen per size, because an ICO carries separate artwork per entry.

The lockup - map outline, ELECTRIFYING THE U.S., the three vehicles - is what
people recognise from the navbar. It holds at 64px, where the wordmark is still
discernible. At 48 the outline has washed out to a tint and the letters have gone;
at 32 and 16 it is a pale blur, and 16 is the size a browser tab actually draws.

So 16, 32 and 48 get the filled map silhouette instead: the same map path, flooded
solid, which is the only version that reads that small. 64 and up - the bookmark
bar, Windows, the iOS home screen, Google's result row - get the lockup.

Both marks come from the same crop, so they cannot drift apart if the source art is
ever redrawn.
"""
import io
import struct
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "assets" / "logo-colored.png"
OUT = ROOT / "public"

BLUE = (12, 74, 177)
GREEN = (25, 126, 50)
WHITE = (255, 255, 255)

# The lockup without the ElectrifyingTheUS.com line, which is the crop that makes
# the mark legible small. Full resolution, so 256 is never upscaled.
LOCKUP_BOX = (75, 255, 1488, 1137)

# Below this, draw the silhouette instead of the lockup.
LOCKUP_MIN = 64

# Sharpening for the sizes with no pixels to spare. The 8x box average is correct
# but soft; without this the 16px coastline is a gradient, not an edge.
SHARPEN = {16: 1.8, 32: 1.4}

ICO_SIZES = [16, 32, 48, 64, 128, 256]


def flatten(im):
    """Composite onto white. Browsers do this anyway, and the map is white inside."""
    im = im.convert("RGBA")
    ground = Image.new("RGBA", im.size, WHITE + (255,))
    ground.alpha_composite(im)
    return ground.convert("RGB")


def silhouette(source):
    """Solid mask of the map: flood the outside, keep interior plus the stroke."""
    ink = np.array(source.convert("RGBA").crop(LOCKUP_BOX).split()[3]) > 40
    h, w = ink.shape
    padded = np.zeros((h + 2, w + 2), bool)
    padded[1:-1, 1:-1] = ink
    outside = np.zeros_like(padded)
    outside[0, 0] = True
    queue = deque([(0, 0)])
    while queue:
        y, x = queue.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if (0 <= ny < padded.shape[0] and 0 <= nx < padded.shape[1]
                    and not outside[ny, nx] and not padded[ny, nx]):
                outside[ny, nx] = True
                queue.append((ny, nx))
    mask = Image.fromarray((~outside[1:-1, 1:-1] * 255).astype("uint8"))
    return mask.crop(mask.getbbox())


SOURCE = Image.open(SRC)
LOCKUP = flatten(SOURCE.crop(LOCKUP_BOX))
MASK = silhouette(SOURCE)


def tile(size):
    """One icon, supersampled 8x so edges antialias before the reduction."""
    n = size * 8
    canvas = Image.new("RGB", (n, n), WHITE)
    if size >= LOCKUP_MIN:
        pad = 0.98            # the lockup needs every pixel it can get
        tw = int(n * pad)
        th = max(1, int(tw * LOCKUP.height / LOCKUP.width))
        canvas.paste(LOCKUP.resize((tw, th), Image.LANCZOS),
                     ((n - tw) // 2, (n - th) // 2))
    else:
        pad = 0.96
        tw = int(n * pad)
        th = max(1, int(tw * MASK.height / MASK.width))
        mask = MASK.resize((tw, th), Image.LANCZOS)
        art = Image.new("RGB", (tw, th), GREEN)
        art.paste(Image.new("RGB", (tw // 2, th), BLUE), (0, 0))
        canvas.paste(art, ((n - tw) // 2, (n - th) // 2), mask)
    # BOX at an exact 8x reduction is a true area average - no Lanczos ringing,
    # which at 16px smeared the coastline into a halo.
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
