// Internal analytics dashboard — /admin. Password-gated (ANALYTICS_PASSWORD,
// verified server-side by /api/analytics). Shows first-party traffic, clicks,
// geography, and known-visitor conversions stored in site_analytics.
//
// The visuals live in AnalyticsView (shared with the CMS-embedded Statistics
// page); this file owns the password gate + data fetching only.

import { useCallback, useEffect, useState } from "react";
import { Activity, LogOut, Lock } from "lucide-react";
import AnalyticsView from "@/components/admin/AnalyticsView";
import type { AnalyticsData, AnalyticsJourney } from "@/lib/admin-api";

const PW_KEY = "etu_analytics_key";

async function fetchAnalytics(password: string, range: string): Promise<{ ok: boolean; status: number; data?: AnalyticsData }> {
  const res = await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, range }),
  });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, status: 200, data: (await res.json()) as AnalyticsData };
}

async function fetchJourney(password: string, visitorId: string): Promise<AnalyticsJourney | null> {
  const res = await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, visitorId }),
  });
  if (!res.ok) return null;
  return (await res.json()) as AnalyticsJourney;
}

/* ── Login ───────────────────────────────────────────────────────────────── */

const Login = ({ onSubmit, error }: { onSubmit: (pw: string) => void; error: string }) => {
  const [pw, setPw] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(pw); }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-elevated"
      >
        <div className="w-12 h-12 rounded-2xl gradient-hero flex items-center justify-center mb-5">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">Analytics</h1>
        <p className="text-sm text-muted-foreground mb-6">Internal dashboard — enter the access password.</p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 mb-3"
        />
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        <button type="submit" className="w-full rounded-xl gradient-hero text-white font-semibold py-3 hover:opacity-90 transition-opacity">
          Sign in
        </button>
      </form>
    </div>
  );
};

/* ── Dashboard ───────────────────────────────────────────────────────────── */

const AdminDashboard = () => {
  const [password, setPassword] = useState<string | null>(() => {
    try { return localStorage.getItem(PW_KEY); } catch { return null; }
  });
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginError, setLoginError] = useState("");

  const load = useCallback(async (pw: string, r: string) => {
    setLoading(true); setError("");
    try {
      const out = await fetchAnalytics(pw, r);
      if (out.status === 401) {
        setLoginError("Wrong password.");
        setPassword(null);
        try { localStorage.removeItem(PW_KEY); } catch { /* ignore */ }
        return;
      }
      if (!out.ok || !out.data) {
        setError(out.status === 500 ? "Analytics isn't fully configured yet (service role key / table)." : "Failed to load.");
        return;
      }
      setData(out.data);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (password) load(password, range);
  }, [password, range, load]);

  const onLogin = (pw: string) => {
    if (!pw) { setLoginError("Enter the password."); return; }
    setLoginError("");
    try { localStorage.setItem(PW_KEY, pw); } catch { /* ignore */ }
    setPassword(pw);
  };

  const logout = () => {
    try { localStorage.removeItem(PW_KEY); } catch { /* ignore */ }
    setPassword(null); setData(null);
  };

  if (!password) return <Login onSubmit={onLogin} error={loginError} />;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="container px-4 py-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold font-display text-foreground leading-none">Site Analytics</h1>
              <p className="text-xs text-muted-foreground">electrifyingtheus.com · first-party</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors" title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="container px-4 py-6">
        <AnalyticsView
          data={data}
          loading={loading}
          error={error}
          range={range}
          onRange={setRange}
          onRefresh={() => load(password, range)}
          fetchJourney={(visitorId) => fetchJourney(password, visitorId)}
        />
      </main>
    </div>
  );
};

export default AdminDashboard;
