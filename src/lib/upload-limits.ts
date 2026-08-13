// How big an upload may be before the platform rejects it.
//
// Uploads go to a Vercel serverless function as JSON with the file base64'd
// inside. Vercel caps the REQUEST BODY, and rejects an oversized one itself —
// the function never runs, so none of our own limits or error messages apply.
// The rejection body is plain text, which is why the CMS could only show the
// bare "Upload failed (413)".
//
// Measured against production by POSTing bodies of known size with no auth,
// so only the transport was under test:
//
//   4,194,304 bytes -> 401 (reached the function)
//   4,613,734 bytes -> 413 FUNCTION_PAYLOAD_TOO_LARGE (rejected before it)
//
// The budget below is the largest size actually MEASURED to get through, not
// the documented limit, and it leaves the rest as headroom.

/** Request-body budget, in bytes. Proven to reach the function. */
export const MAX_REQUEST_BYTES = 4_000_000;

/** Length of `bytes` once base64-encoded: 4 characters per 3 bytes, padded. */
export function base64Length(bytes: number): number {
  return Math.ceil(bytes / 3) * 4;
}

/**
 * The largest file that still fits once base64-encoded and wrapped in JSON.
 * `envelopeBytes` is everything in the body that isn't the encoded file.
 */
export function maxBinaryBytes(envelopeBytes: number): number {
  const room = MAX_REQUEST_BYTES - envelopeBytes;
  if (room <= 0) return 0;
  // Invert base64Length: n bytes -> ceil(n/3)*4 chars, so groups = floor(room/4).
  return Math.max(0, Math.floor(room / 4) * 3);
}

const mb = (bytes: number) => {
  const v = bytes / (1024 * 1024);
  // Whole numbers read better than "8.0 MB"; keep one decimal otherwise.
  return `${Number.isInteger(v) ? v : v.toFixed(1)} MB`;
};

/** What to tell an editor whose file is too big — never a bare status code. */
export function describeTooLarge(actualBytes: number, limitBytes: number): string {
  return `That file is ${mb(actualBytes)}, and the largest an upload can be is ${mb(limitBytes)}. Please resize or re-export it smaller and try again.`;
}
