// Returns the signed-in editor's identity + role when authorized, else 401.
// The admin UI calls this after sign-in to confirm the account is allow-listed
// (a valid Supabase login that isn't in `editors` is NOT a CMS editor).

import { getEditor } from "../_admin-auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const editor = await getEditor(req);
  if (!editor) { res.status(401).json({ error: "unauthorized" }); return; }
  res.status(200).json({ email: editor.email, role: editor.role });
}
