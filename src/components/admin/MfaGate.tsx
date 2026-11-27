// Second sign-in step for the CMS. "enroll": first time, scan a QR code with an
// authenticator app (Google Authenticator, 1Password, Authy…) and confirm a
// code. "verify": every later sign-in, type the current 6-digit code.
// The server enforces the same rule (_admin-auth.ts requires an aal2 session).

import { useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { enrollTotp, signOut, verifiedTotpFactor, verifyTotp, type TotpEnrollment } from "@/lib/auth";

const MfaGate = ({ mode }: { mode: "enroll" | "verify" }) => {
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (mode === "enroll") {
        const { data, error: err } = await enrollTotp();
        if (cancelled) return;
        if (err || !data) { setError(err ?? "Could not start 2FA setup."); return; }
        setEnrollment(data);
        setFactorId(data.factorId);
      } else {
        const id = await verifiedTotpFactor();
        if (!cancelled) id ? setFactorId(id) : setError("No authenticator found for this account.");
      }
    })();
    return () => { cancelled = true; };
  }, [mode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setError("");
    const { error: err } = await verifyTotp(factorId, code);
    setBusy(false);
    if (err) { setError("That code didn't work. Check the time on your phone and try the newest code."); setCode(""); }
    // Success: Supabase fires an auth change and RequireEditor re-resolves.
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <form onSubmit={onSubmit} className="max-w-sm w-full rounded-3xl border border-border bg-card p-8 shadow-elevated">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto mb-5">
          {mode === "enroll" ? <ShieldCheck className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
        </div>
        <h1 className="text-xl font-bold font-display text-foreground mb-1 text-center">
          {mode === "enroll" ? "Set up two-factor sign-in" : "Enter your 2FA code"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          {mode === "enroll"
            ? "The content editor now needs a code from an authenticator app. Scan this with Google Authenticator, 1Password, Authy or similar, then enter the 6-digit code it shows."
            : "Open your authenticator app and enter the 6-digit code for Electrifying the US."}
        </p>

        {mode === "enroll" && (
          enrollment ? (
            <div className="mb-6 text-center">
              <img src={enrollment.qr} alt="QR code for your authenticator app" className="w-48 h-48 mx-auto rounded-xl bg-white p-2" />
              <p className="text-xs text-muted-foreground mt-3">Can't scan? Enter this key:</p>
              <code className="block text-xs font-mono break-all bg-muted rounded-lg px-3 py-2 mt-1 select-all">{enrollment.secret}</code>
            </div>
          ) : !error && (
            <div className="grid place-items-center h-48 mb-6 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
          )
        )}

        <label htmlFor="mfa-code" className="block text-sm font-semibold text-foreground mb-1.5">6-digit code</label>
        <input
          id="mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg tracking-[0.3em] text-center font-mono mb-3"
          autoFocus
          required
        />
        {error && <p role="alert" className="text-sm text-destructive mb-3">{error}</p>}
        <button
          type="submit"
          disabled={busy || !factorId || code.replace(/\s/g, "").length !== 6}
          className="w-full rounded-xl gradient-primary text-primary-foreground font-semibold py-3 disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} {mode === "enroll" ? "Turn on 2FA" : "Verify"}
        </button>
        <button type="button" onClick={() => signOut()} className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground">
          Sign out
        </button>
        {mode === "verify" && (
          <p className="text-xs text-muted-foreground mt-4 text-center">Lost your phone? Ask an admin to reset your 2FA.</p>
        )}
      </form>
    </div>
  );
};

export default MfaGate;
