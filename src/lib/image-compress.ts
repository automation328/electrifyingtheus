// Shrink an image in the browser before it is uploaded.
//
// Uploads travel base64'd inside a JSON body, and base64 costs 4 bytes for
// every 3 — so a 4 MB photo becomes a 5.4 MB request and the platform rejects
// it outright (see upload-limits.ts). Re-encoding at web dimensions keeps the
// request comfortably inside the budget, and a 4000px original was never worth
// serving to visitors anyway.
//
// The canvas work is deliberately thin; every decision lives in the two pure
// helpers below, which are unit-tested.

/** Longest edge we keep. Bigger than any slot the site actually renders. */
export const MAX_DIMENSION = 2200;

/** Formats we can safely redraw. SVG is vector, GIF may be animated. */
const RASTERISABLE = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp"]);

/** Quality ladder, tried in order until the result fits. */
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45];

/** Fit `width`x`height` inside `max` on its longest edge, keeping the ratio. */
export function targetDimensions(width: number, height: number, max: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max || longest === 0) return { width, height };
  const scale = max / longest;
  return {
    // A very wide image can scale its short edge below 1px — never let a
    // dimension reach zero or the canvas draws nothing.
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Whether it is worth (and safe) re-encoding this file. */
export function shouldCompress(type: string, sizeBytes: number, limitBytes: number): boolean {
  if (!RASTERISABLE.has(type)) return false;   // vector or animated — leave it alone
  return sizeBytes > limitBytes;               // already fits: don't lose quality for nothing
}

/** Does this browser actually produce WebP from a canvas? */
function canEncodeWebp(canvas: HTMLCanvasElement): boolean {
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

async function decode(file: File): Promise<{ width: number; height: number; draw: CanvasImageSource; done: () => void }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return { width: bitmap.width, height: bitmap.height, draw: bitmap, done: () => bitmap.close() };
  }
  // Older Safari: go via an <img> and an object URL.
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that image."));
      el.src = url;
    });
    return { width: img.naturalWidth, height: img.naturalHeight, draw: img, done: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/**
 * Return a version of `file` under `limitBytes`, or the original when it
 * already fits, cannot be redrawn, or the browser refuses to co-operate.
 * Never throws for a compression failure — the caller checks the size and
 * explains the problem, so a broken canvas can't block an upload that would
 * otherwise have worked.
 */
export async function compressImageForUpload(file: File, limitBytes: number): Promise<File> {
  if (!shouldCompress(file.type, file.size, limitBytes)) return file;
  if (typeof document === "undefined") return file;

  let handle: Awaited<ReturnType<typeof decode>> | null = null;
  try {
    handle = await decode(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // WebP keeps transparency and compresses harder; JPEG is the fallback, and
    // needs a white ground or a transparent PNG turns black.
    const webp = canEncodeWebp(canvas);
    const outType = webp ? "image/webp" : "image/jpeg";
    const ext = webp ? "webp" : "jpg";

    // Halve the cap if the first pass isn't small enough — some images are
    // large because of detail, not dimensions.
    for (const cap of [MAX_DIMENSION, MAX_DIMENSION / 2, MAX_DIMENSION / 4]) {
      const { width, height } = targetDimensions(handle.width, handle.height, cap);
      if (width === 0 || height === 0) return file;
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      if (!webp) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height); }
      ctx.drawImage(handle.draw, 0, 0, width, height);

      for (const quality of QUALITIES) {
        const blob = await toBlob(canvas, outType, quality);
        if (!blob) return file;
        if (blob.size <= limitBytes) {
          const name = file.name.replace(/\.[^.]+$/, "") || "image";
          return new File([blob], `${name}.${ext}`, { type: outType });
        }
      }
    }
    return file;   // couldn't get it under the limit; caller reports the size
  } catch {
    return file;   // decoding failed — let the caller's size check speak
  } finally {
    handle?.done();
  }
}
