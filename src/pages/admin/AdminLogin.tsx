// CMS sign-in. Invite-only: accounts are created by an admin in Supabase (public
// signups are disabled), and the email must also be an allow-listed editor.
// On success we route to /admin/content; RequireEditor there confirms authorization.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import { signIn, useEditorAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

const AdminLogin = () => {
  const navigate = useNavigate();
  const auth = useEditorAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already an authorized editor → skip the form.
  useEffect(() => {
    if (auth.status === "editor") navigate("/admin/content", { replace: true });
  }, [auth.status, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setBusy(true);
    const { error: err } = await signIn(email, password);
    setBusy(false);
    if (err) { setError(err); return; }
    // Auth state change triggers RequireEditor / the effect above.
    navigate("/admin/content", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-elevated">
        <div className="w-12 h-12 rounded-2xl gradient-hero flex items-center justify-center mb-5">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">Content editor</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in with your editor account.</p>

        {!isSupabaseConfigured && (
          <p className="text-sm text-amber-600 mb-4">
            Supabase isn't configured in this environment, so sign-in is unavailable.
          </p>
        )}

        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="username"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 mb-3"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 mb-3"
        />
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        <button
          type="submit"
          disabled={busy || !isSupabaseConfigured}
          className="w-full rounded-xl gradient-hero text-white font-semibold py-3 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign in
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
