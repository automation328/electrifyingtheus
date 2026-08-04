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
import { usePageOverride, mergePageOverride, pickPageOverride, EDITABLE_PAGES, type PageOverride, type PageBlock, type BlockType } from "@/lib/page-content";
import { useEditorAuth } from "@/lib/auth";
import { listRows, insertRow, updateRow } from "@/lib/admin-api";

type LayoutProps = React.ComponentProps<typeof ContentPageLayout>;

interface PageRow { id: string; path: string; status: string; content: PageOverride }

// A fresh block seeded with sensible defaults so it's immediately visible/editable.
function newBlock(type: BlockType): PageBlock {
  const id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `blk_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
  const base: PageBlock = { id, slot: "", type };
  switch (type) {
    case "heading": return { ...base, text: "New heading", level: 2, align: "center" };
    case "text": return { ...base, text: "New paragraph. Click to edit this text.", align: "left" };
    case "image": return { ...base, src: "", caption: "", align: "center" };
    case "video": return { ...base, provider: "youtube", videoId: "", align: "center" };
    case "button": return { ...base, text: "Learn more", href: "", align: "center" };
    case "spacer": return { ...base, height: 40 };
    case "icon": return { ...base, icon: "zap", align: "center" };
    default: return base; // divider
  }
}

// Swap a block with its nearest same-slot neighbour in the given direction.
function moveWithinSlot(blocks: PageBlock[], id: string, dir: -1 | 1): PageBlock[] {
  const arr = [...blocks];
  const idx = arr.findIndex((b) => b.id === id);
  if (idx < 0) return arr;
  const slot = arr[idx].slot;
  let j = idx + dir;
  while (j >= 0 && j < arr.length && arr[j].slot !== slot) j += dir;
  if (j < 0 || j >= arr.length) return arr;
  [arr[idx], arr[j]] = [arr[j], arr[idx]];
  return arr;
}

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

  const mutateBlocks = (fn: (blocks: PageBlock[]) => PageBlock[]) => {
    setWorking((w) => ({ ...w, blocks: fn(w.blocks ?? []) }));
    setDirty(true);
  };

  const ctx = useMemo(() => ({
    editing,
    set: (p: string, v: unknown) => { setWorking((w) => setPath(w, p, v)); setDirty(true); },
    get: (p: string) => getPath(working, p),
    addBlock: (slot: string, type: BlockType) => mutateBlocks((blocks) => [...blocks, { ...newBlock(type), slot }]),
    updateBlock: (id: string, patch: Partial<PageBlock>) => mutateBlocks((blocks) => blocks.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    moveBlock: (id: string, dir: -1 | 1) => mutateBlocks((blocks) => moveWithinSlot(blocks, id, dir)),
    removeBlock: (id: string) => mutateBlocks((blocks) => blocks.filter((b) => b.id !== id)),
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
