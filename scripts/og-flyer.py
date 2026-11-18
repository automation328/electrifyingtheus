"""Turn an event flyer into a 1200x630 share image (JPEG).

The whole flyer is shown, centred over a blurred, darkened copy of itself, so
portrait and square flyers are not cropped by Facebook/LinkedIn/Slack previews.
Usage: python scripts/og-flyer.py <src image> <dest .jpg>
"""
import sys
from PIL import Image, ImageFilter, ImageEnhance

W, H = 1200, 630
src, dest = sys.argv[1], sys.argv[2]
img = Image.open(src).convert("RGB")

bg = img.copy()
scale = max(W / bg.width, H / bg.height)
bg = bg.resize((round(bg.width * scale), round(bg.height * scale)), Image.LANCZOS)
left, top = (bg.width - W) // 2, (bg.height - H) // 2
bg = bg.crop((left, top, left + W, top + H)).filter(ImageFilter.GaussianBlur(28))
bg = ImageEnhance.Brightness(bg).enhance(0.55)

fit = min(W / img.width, H / img.height)
fg = img.resize((round(img.width * fit), round(img.height * fit)), Image.LANCZOS)
bg.paste(fg, ((W - fg.width) // 2, (H - fg.height) // 2))
bg.save(dest, "JPEG", quality=85, optimize=True, progressive=True)
