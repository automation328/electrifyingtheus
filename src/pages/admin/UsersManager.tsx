// CMS user management (admin only). Manages the `editors` allow-list and each
// person's role. Adding a user to the allow-list authorizes an existing Supabase
// Auth account; "Invite" emails them a sign-up link so they can set a password.
// All actions are enforced server-side in api/admin.ts (handleEditors).

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, Mail, ShieldCheck, AlertCircle, Users, KeyRound, Copy, Check, X } from "lucide-react";
import { listEditors, addEditor, setEditorRole, removeEditor, inviteEditor, setEditorPassword, type EditorRow, type EditorRole } from "@/lib/admin-api";
import { useEditorAuth } from "@/lib/auth";

const ROLE_INFO: { value: EditorRole; label: string; desc: string }[] = [
  { value: "admin", label: "Admin", desc: "Full control — content, publishing, media, site settings, EVan knowledge, and managing users." },
  { value: "editor", label: "Editor", desc: "Create, edit and publish all content, plus media, settings and knowledge base. Can't manage users." },
  { value: "author", label: "Author", desc: "Create and edit content as drafts only — an editor publishes it. No settings or knowledge base." },
  { value: "viewer", label: "Viewer", desc: "Read-only. Can browse the admin but can't change anything." },
];
const ROLE_LABEL = Object.fromEntries(ROLE_INFO.map((r) => [r.value, r.label])) as Record<EditorRole, string>;
const roleTone = (r: EditorRole) =>
  r === "admin" ? "bg-primary/10 text-primary" : r === "editor" ? "bg-secondary/15 text-secondary" : r === "author" ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground";

const UsersManager = () => {
  const qc = useQueryClient();
  const auth = useEditorAuth();
  const isAdmin = auth.status === "editor" && auth.editor.role === "admin";
  const myEmail = auth.status === "editor" ? auth.editor.email.toLowerCase() : "";

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin-editors"],
    queryFn: listEditors,
    enabled: isAdmin,
    retry: false,
  });

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<EditorRole>("editor");
  const [createLogin, setCreateLogin] = useState(true);
  const [busy, setBusy] = useState(false);
  // A just-created/reset password to show once so the admin can copy + share it.
  const [cred, setCred] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-editors"] });

  const copyCred = async () => {
    if (!cred) return;
    try { await navigator.clipboard.writeText(cred.password); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { toast.error("Couldn't copy — select and copy manually."); }
  };

  const add = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return;
    setBusy(true);
    try {
      const r = await addEditor(e, role, { createLogin });
      invalidate();
      setEmail("");
      if (r.tempPassword) { setCred({ email: e, password: r.tempPassword }); toast.success(`Login created for ${e}`); }
      else if (r.loginExists) toast.success(`Added ${e}`, { description: "They already have a login and can sign in." });
      else if (r.loginError) toast.warning(`Added ${e}`, { description: `Couldn't create login: ${r.loginError}` });
      else toast.success(`Added ${e}`, { description: "Use “Set password” to give them a login." });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add user.");
    } finally { setBusy(false); }
  };

  const setPassword = async (row: EditorRow) => {
    if (!window.confirm(`Set a new temporary password for ${row.email}? Their current password (if any) will stop working.`)) return;
    try {
      const { tempPassword } = await setEditorPassword(row.email);
      if (tempPassword) { setCred({ email: row.email, password: tempPassword }); toast.success(`New password set for ${row.email}`); }
      else toast.success(`Password updated for ${row.email}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Couldn't set password."); }
  };

  const changeRole = async (row: EditorRow, next: EditorRole) => {
    try { await setEditorRole(row.id, next); invalidate(); toast.success(`${row.email} is now ${ROLE_LABEL[next]}`); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Couldn't change role."); invalidate(); }
  };

  const invite = async (row: EditorRow) => {
    try { await inviteEditor(row.email); toast.success(`Invite sent to ${row.email}`); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Couldn't send invite (email may not be configured)."); }
  };

  const remove = async (row: EditorRow) => {
    if (!window.confirm(`Remove ${row.email}? They'll lose access to the CMS.`)) return;
    try { await removeEditor(row.id); invalidate(); toast.success(`Removed ${row.email}`); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Couldn't remove user."); }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold font-display text-foreground mb-2 flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Users</h1>
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> Only admins can manage users. Ask an admin to change your role if you need access.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold font-display text-foreground mb-1 flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Users</h1>
      <p className="text-sm text-muted-foreground mb-6">Invite teammates and set what each can do. Everyone still signs in with their own login.</p>

      {/* Add */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-5">
        <h2 className="font-bold font-display text-foreground mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4 text-primary" /> Add a user</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} type="email" placeholder="teammate@company.com" className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm" />
          <select value={role} onChange={(e) => setRole(e.target.value as EditorRole)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
            {ROLE_INFO.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button onClick={add} disabled={busy || !email.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add
          </button>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={createLogin} onChange={(e) => setCreateLogin(e.target.checked)} />
          Create their login now &amp; show a temporary password to share
        </label>
        <p className="text-xs text-muted-foreground mt-1.5">No Supabase trip needed. Leave this on to provision their account instantly — you'll get a one-time password to send them (they can change it after signing in). Turn it off to only add them to the allow-list.</p>
      </div>

      {cred && (
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 mb-5">
          <div className="flex items-start gap-2">
            <KeyRound className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-foreground">Login ready for {cred.email}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Share this one-time password securely. It won't be shown again — ask them to change it after signing in.</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground select-all break-all">{cred.password}</code>
                <button onClick={copyCred} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <button onClick={() => setCred(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted" title="Dismiss"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> Couldn't load users — {(error as Error).message}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : (
        <ul className="space-y-2 mb-8">
          {rows.map((row) => {
            const isMe = row.email.toLowerCase() === myEmail;
            return (
              <li key={row.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                <div className="w-9 h-9 rounded-full gradient-hero grid place-items-center text-white shrink-0"><ShieldCheck className="w-4 h-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-foreground truncate">{row.email}{isMe && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}</div>
                  <div className="text-xs text-muted-foreground">Added {new Date(row.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 ${roleTone(row.role)}`}>{ROLE_LABEL[row.role] ?? row.role}</span>
                <select value={row.role} onChange={(e) => changeRole(row, e.target.value as EditorRole)} disabled={isMe} title={isMe ? "You can't change your own role" : "Change role"} className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm disabled:opacity-50">
                  {ROLE_INFO.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button onClick={() => setPassword(row)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted" title="Set a new temporary password"><KeyRound className="w-4 h-4" /></button>
                <button onClick={() => invite(row)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted" title="Email an invite / password link"><Mail className="w-4 h-4" /></button>
                <button onClick={() => remove(row)} disabled={isMe} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted disabled:opacity-40" title={isMe ? "You can't remove yourself" : "Remove user"}><Trash2 className="w-4 h-4" /></button>
              </li>
            );
          })}
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No users yet.</p>}
        </ul>
      )}

      {/* Role legend */}
      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">What each role can do</h2>
        <dl className="space-y-2.5">
          {ROLE_INFO.map((r) => (
            <div key={r.value} className="flex gap-3">
              <dt className={`shrink-0 text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 h-fit ${roleTone(r.value)}`}>{r.label}</dt>
              <dd className="text-sm text-muted-foreground">{r.desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default UsersManager;
