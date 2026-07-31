// Route guard for the CMS. Renders children only for an allow-listed, signed-in
// editor. Signed-out users are sent to /admin/login; a valid Supabase login that
// isn't an allow-listed editor gets a clear "not authorized" screen.

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useEditorAuth, signOut } from "@/lib/auth";

const RequireEditor = ({ children }: { children: ReactNode }) => {
  const auth = useEditorAuth();

  if (auth.status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (auth.status === "signed-out") {
    return <Navigate to="/admin/login" replace />;
  }

  if (auth.status === "not-authorized") {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="max-w-sm w-full rounded-3xl border border-border bg-card p-8 shadow-elevated text-center">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive grid place-items-center mx-auto mb-5">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-display text-foreground mb-1">Not authorized</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You're signed in, but this account isn't on the editor list. Ask an admin to add you.
          </p>
          <button
            onClick={() => signOut()}
            className="w-full rounded-xl border border-border bg-background text-foreground font-semibold py-3 hover:bg-muted transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireEditor;
