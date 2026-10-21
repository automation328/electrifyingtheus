import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The editors lookup is stubbed: these tests are about the GoTrue response.
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        ilike: () => ({
          maybeSingle: async () => ({ data: { email: "ed@example.com", role: "admin" }, error: null }),
        }),
      }),
    }),
  }),
}));

import { getEditor } from "./_admin-auth.js";

const req = { headers: { authorization: "Bearer tok" } };
const gotrue = (user: object) =>
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => user }));

describe("getEditor", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.VITE_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
  });
  afterEach(() => vi.unstubAllGlobals());

  it("accepts a confirmed allow-listed account", async () => {
    gotrue({ email: "ed@example.com", email_confirmed_at: "2026-01-01T00:00:00Z" });
    expect(await getEditor(req)).toEqual({ email: "ed@example.com", role: "admin" });
  });

  it("rejects an unconfirmed account even if the email is allow-listed", async () => {
    gotrue({ email: "ed@example.com", email_confirmed_at: null });
    expect(await getEditor(req)).toBeNull();
  });
});
