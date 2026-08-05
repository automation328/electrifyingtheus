// Drop-in replacement for <ContentPageLayout> that adds (a) the CMS prose/photo
// override for a page and (b) WordPress-style on-page editing for signed-in
// editors. Pages swap `ContentPageLayout` → `EditableContentPage` and add a
// `path`; everything else stays as passed.

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ContentPageLayout from "@/components/ContentPageLayout";
import EditBar from "@/components/inline/EditBar";
import { InlineEditContext, setPath, getPath } from "@/components/inline/edit-context";
import { usePageOverride, mergePageOverride, pickPageOverride, EDITABLE_PAGES, type PageOverride, type PageBlock, type BlockType } from "@/lib/page-content";
import { useEditorAuth } from "@/lib/auth";
import { listRows, insertRow, updateRow } from "@/lib/admin-api";

type LayoutProps = React.ComponentProps<typeof ContentPageLayout>;

interface PageRow { id: string; path: string; status: string; title?: string; content: PageOverride }

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
    case "accordion": return { ...base, items: [{ title: "Question one?", body: "Answer to the first question." }, { title: "Question two?", body: "Answer to the second question." }] };
    case "tabs": return { ...base, items: [{ title: "Tab one", body: "Content for the first tab." }, { title: "Tab two", body: "Content for the second tab." }] };
    case "columns": return { ...base, columns: [{ body: "First column text." }, { body: "Second column text." }] };
    case "gallery": return { ...base, images: [] };
    case "cta": return { ...base, text: "Ready to make the switch?", subtext: "See what you'd save with an EV, or explore the incentives available in your area.", buttonLabel: "Open the calculator", href: "/electricity-vs-gasoline" };
    case "image-box": return { ...base, src: "", text: "Title", subtext: "A short supporting description.", align: "center" };
    case "icon-box": return { ...base, icon: "zap", text: "Title", subtext: "A short supporting description.", align: "center" };
    case "counter": return { ...base, text: "60%", subtext: "Lower lifecycle emissions", align: "center" };
    case "countdown": return { ...base, text: "", subtext: "Event starts in", align: "center" };
    case "maps": return { ...base, text: "" };
    case "html": return { ...base, text: "" };
    default: return base; // divider
  }
}

const lastIndexWhere = <T,>(arr: T[], pred: (x: T) => boolean): number => {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return i;
  return -1;
};

// Move a block one step "up"/"down" in overall page order: reorder within its
// slot when it has a neighbour there, otherwise hop to the adjacent slot (using
// the page's ordered slot list) so up/down always does something visible.
function moveBlockInList(blocks: PageBlock[], id: string, dir: -1 | 1, slotOrder: string[]): PageBlock[] {
  const arr = [...blocks];
  const idx = arr.findIndex((b) => b.id === id);
  if (idx < 0) return arr;
  const b = arr[idx];
  const siblings = arr.filter((x) => x.slot === b.slot);
  const pos = siblings.indexOf(b);

  // Same-slot neighbour → swap.
  if (dir === -1 && pos > 0) {
    const j = arr.indexOf(siblings[pos - 1]);
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    return arr;
  }
  if (dir === 1 && pos < siblings.length - 1) {
    const j = arr.indexOf(siblings[pos + 1]);
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    return arr;
  }

  // At the slot edge → hop to the adjacent slot.
  const si = slotOrder.indexOf(b.slot);
  const target = slotOrder[si + dir];
  if (!target) return arr; // already at the page edge
  const without = arr.filter((x) => x.id !== id);
  const moved: PageBlock = { ...b, slot: target };
  if (dir === -1) {
    const at = lastIndexWhere(without, (x) => x.slot === target);
    if (at < 0) without.push(moved); else without.splice(at + 1, 0, moved);
  } else {
    const at = without.findIndex((x) => x.slot === target);
    if (at < 0) without.push(moved); else without.splice(at, 0, moved);
  }
  return without;
}

const EditableContentPage = ({ path, label, ...props }: LayoutProps & { path: string; label?: string }) => {
  const qc = useQueryClient();
  const auth = useEditorAuth();
  const isEditor = auth.status === "editor";
  const published = usePageOverride(path);

  // Editors also load the DB row at ANY status (so drafts are visible/editable).
  const editorRowQuery = useQuery({
    queryKey: ["editor-page-row", path],
    queryFn: async () => (await listRows<PageRow>("site_pages")).find((r) => r.path === path) ?? null,
    enabled: isEditor,
    staleTime: 30_000,
  });
  const baseOverride = (isEditor ? (editorRowQuery.data?.content ?? published) : published) as PageOverride | null;

  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState<PageOverride>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // What the layout renders: the working copy while editing, else the effective override.
  const rendered = useMemo(
    () => mergePageOverride(props as PageOverride, editing ? working : baseOverride) as LayoutProps,
    [props, editing, working, baseOverride],
  );

  // Ordered insertion slots for this page (used by move up/down).
  const slotOrder = useMemo(() => {
    const n = ((props as PageOverride).sections ?? []).length;
    return ["after-stats", ...Array.from({ length: n }, (_, i) => `after-section-${i}`), "end"];
  }, [props]);

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
    moveBlock: (id: string, dir: -1 | 1) => mutateBlocks((blocks) => moveBlockInList(blocks, id, dir, slotOrder)),
    duplicateBlock: (id: string) => mutateBlocks((blocks) => {
      const i = blocks.findIndex((b) => b.id === id);
      if (i < 0) return blocks;
      const copy = structuredClone(blocks[i]);
      copy.id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `blk_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
      return [...blocks.slice(0, i + 1), copy, ...blocks.slice(i + 1)];
    }),
    removeBlock: (id: string) => mutateBlocks((blocks) => blocks.filter((b) => b.id !== id)),
    moveBlockRelative: (dragId: string, targetId: string, before: boolean) => mutateBlocks((blocks) => {
      if (dragId === targetId) return blocks;
      const dragged = blocks.find((b) => b.id === dragId);
      const target = blocks.find((b) => b.id === targetId);
      if (!dragged || !target) return blocks;
      const without = blocks.filter((b) => b.id !== dragId);
      const ti = without.findIndex((b) => b.id === targetId);
      const moved: PageBlock = { ...dragged, slot: target.slot };
      const at = before ? ti : ti + 1;
      return [...without.slice(0, at), moved, ...without.slice(at)];
    }),
  }), [editing, working, slotOrder]);

  const startEdit = () => {
    // Snapshot the current effective content so every field/path exists to edit.
    const effective = mergePageOverride(props as PageOverride, baseOverride) as Record<string, unknown>;
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
      const title = label ?? EDITABLE_PAGES.find((p) => p.path === path)?.label ?? existing?.title ?? path;
      const payload = { path, title, status, content: working, updated_at: new Date().toISOString() };
      if (existing) await updateRow("site_pages", existing.id, payload);
      else await insertRow("site_pages", payload);
      qc.invalidateQueries({ queryKey: ["site-page", path] });
      qc.invalidateQueries({ queryKey: ["editor-page-row", path] });
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
