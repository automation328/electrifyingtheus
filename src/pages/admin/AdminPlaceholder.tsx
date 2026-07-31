// Temporary stand-in for CMS sections that land in a later phase, so the sidebar
// links never dead-end during the build-out.

import { Construction } from "lucide-react";

const AdminPlaceholder = ({ title, note }: { title: string; note?: string }) => (
  <div className="max-w-2xl">
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-muted grid place-items-center mx-auto mb-4 text-muted-foreground">
        <Construction className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold font-display text-foreground mb-1">{title}</h1>
      <p className="text-sm text-muted-foreground">{note || "This editor is coming in a later phase."}</p>
    </div>
  </div>
);

export default AdminPlaceholder;
