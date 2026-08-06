// Lets the signed-in editor change their own password (e.g. after signing in
// with an admin-provided temporary password). Uses the active Supabase session,
// so no email/redirect is involved.

import { useState } from "react";
import { toast } from "sonner";
import { X, KeyRound, Loader2 } from "lucide-react";
import { changePassword } from "@/lib/auth";

const ChangePasswordModal = ({ onClose }: { onClose: () => void }) => {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (pw.length < 8) { toast.error("Use at least 8 characters."); return; }
    if (pw !== confirm) { toast.error("Passwords don't match."); return; }
    setBusy(true);
    const { error } = await changePassword(pw);
    setBusy(false);
    if (error) { toast.error(error); return; }
    toast.success("Password changed — use it next time you sign in.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-3">
          <h3 className="font-bold font-display text-foreground flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" /> Change password</h3>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">New password</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm mb-3" />
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Confirm new password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} autoComplete="new-password" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm mb-4" />
        <button onClick={submit} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Update password
        </button>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
