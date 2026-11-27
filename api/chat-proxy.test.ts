import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./_rate-limit.js", () => ({
  checkRateLimit: vi.fn(async () => ({ ok: true })),
  tooManyRequests: vi.fn((res) => res.status(429).json({ error: "rate_limited" })),
}));
import { checkRateLimit } from "./_rate-limit.js";
import { handleChat } from "./_chat-proxy";

const makeRes = () => {
  const r = { code: 0, body: "" as unknown, headers: {} as Record<string, string>,
    status(c: number) { r.code = c; return r; },
    json(b: unknown) { r.body = b; return r; },
    setHeader(k: string, v: string) { r.headers[k] = v; },
    end(b?: string) { r.body = b; return r; } };
  return r;
};

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.mocked(checkRateLimit).mockClear(); });

describe("EVan chat proxy", () => {
  it("forwards to n8n with the shared secret and returns the reply", async () => {
    vi.stubEnv("N8N_CHAT_WEBHOOK_URL", "https://n8n.example/webhook/evan-chat");
    vi.stubEnv("N8N_CHAT_SECRET", "s3cret");
    const fetchMock = vi.fn(async () => new Response('{"output":"hi"}', { headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const res = makeRes();
    await handleChat({ method: "POST", headers: {}, body: { chatInput: "hello" } }, res);
    expect(res.code).toBe(200);
    expect(res.body).toBe('{"output":"hi"}');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://n8n.example/webhook/evan-chat");
    expect((init.headers as Record<string, string>)["X-ETU-Chat-Secret"]).toBe("s3cret");
  });

  it("refuses past the rate limit without calling n8n", async () => {
    vi.stubEnv("N8N_CHAT_WEBHOOK_URL", "https://n8n.example/webhook/evan-chat");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ ok: false, hits: 31, limit: 30, retryAfter: 60 });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = makeRes();
    await handleChat({ method: "POST", headers: {}, body: {} }, res);
    expect(res.code).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies and hides upstream errors", async () => {
    vi.stubEnv("N8N_CHAT_WEBHOOK_URL", "https://n8n.example/webhook/evan-chat");
    const big = makeRes();
    await handleChat({ method: "POST", headers: {}, body: { chatInput: "x".repeat(9000) } }, big);
    expect(big.code).toBe(413);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("stack trace here", { status: 500 })));
    const res = makeRes();
    await handleChat({ method: "POST", headers: {}, body: {} }, res);
    expect(res.code).toBe(502);
    expect(String(res.body)).not.toContain("stack");
  });
});
