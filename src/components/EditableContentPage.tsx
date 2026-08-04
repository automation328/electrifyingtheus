// Drop-in replacement for <ContentPageLayout> that adds (a) the CMS prose/photo
// override for a page and (b) WordPress-style on-page editing for signed-in
// editors. Pages swap `ContentPageLayout` → `EditableContentPage` and add a
// `path`; everything else stays as passed.

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ContentPageLayout from "@/components/ContentPageLayout";
import EditBar from "@/components/inline/EditBar";
import { InlineEditContext, setPath, getPath } from "@/components/inline/edit-context";
import { usePageOverride, mergePageOverride, pickPageOverride, EDITABLE_PAGES, type PageOverride } from "@/lib/page-content";
import { useEditorAuth } from "@/lib/auth";
import { listRows, insertRow, updateRow } from "@/lib/admin-api";

type LayoutProps = React.ComponentProps<typeof ContentPageLayout>;

interface PageRow { id: string; path: string; status: string; content: PageOverride }

const EditableContentPage = ({ path, ...props }: LayoutProps & { path: string }) => {
  const qc = useQueryClient();
  const auth = useEditorAuth();
  const isEditor = auth.status === "editor";
  const published = usePageOverride(path);

  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState<PageOverride>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // What the layout renders: the working copy while editing, else the published override.
  const rendered = useMemo(
    () => mergePageOverride(props as PageOverride, editing ? working : published) as LayoutProps,
    [props, editing, working, published],
  );

  const ctx = useMemo(() => ({
    editing,
    set: (p: string, v: unknown) => { setWorking((w) => setPath(w, p, v)); setDirty(true); },
    get: (p: string) => getPath(working, p),
  }), [editing, working]);

  const startEdit = () => {
    // Snapshot the current effective content so every field/path exists to edit.
    const effective = mergePageOverride(props as PageOverride, published) as Record<string, unknown>;
    setWorking(pickPageOverride(effective));
    setDirty(false);
    setEditing(true);
  };

  const cancel = () => { setEditing(false); setDirty(false); setWorking({}); };

  const save = async (status: "draft" | "published") => {
    setSaving(true);
    try {
      const rows = await listRows<PageRow>("site_pages");
      const existing = rows.find((r) => r.path === path);
      const label = EDITABLE_PAGES.find((p) => p.path === path)?.label ?? path;
      const payload = { path, title: label, status, content: working, updated_at: new Date().toISOString() };
      if (existing) await updateRow("site_pages", existing.id, payload);
      else await insertRow("site_pages", payload);
      qc.invalidateQueries({ queryKey: ["site-page", path] });
      toast.success(status === "published" ? "Page published" : "Draft saved");
      setEditing(false); setDirty(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <InlineEditContext.Provider value={ctx}>
      <ContentPageLayout {...rendered} />
      {isEditor && (
        <EditBar
          editing={editing}
          dirty={dirty}
          saving={saving}
          onEdit={startEdit}
          onCancel={cancel}
          onSaveDraft={() => save("draft")}
          onPublish={() => save("published")}
        />
      )}
    </InlineEditContext.Provider>
  );
};

export default EditableContentPage;
