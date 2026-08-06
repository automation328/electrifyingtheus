// Drop-in replacement for <ContentPageLayout> that adds (a) the CMS prose/photo
// override for a page and (b) WordPress-style on-page editing for signed-in
// editors. Pages swap `ContentPageLayout` → `EditableContentPage` and add a
// `path`; everything else stays as passed.

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ContentPageLayout from "@/components/ContentPageLayout";
import EditBar from "@/components/inline/EditBar";
import OutlinePanel from "@/components/inline/OutlinePanel";
import SeoModal from "@/components/inline/SeoModal";
import SeoHead from "@/components/SeoHead";
import { InlineEditContext, setPath, getPath } from "@/components/inline/edit-context";
import { usePageOverride, mergePageOverride, pickPageOverride, EDITABLE_PAGES, PAGE_OVERRIDE_KEYS, type PageOverride, type PageBlock, type BlockType } from "@/lib/page-content";
import { newBlock, newId, regenIds } from "@/components/inline/blocks/factory";
import { useEditorAuth } from "@/lib/auth";
import { listRows, insertRow, updateRow } from "@/lib/admin-api";

type LayoutProps = React.ComponentProps<typeof ContentPageLayout>;

interface PageRow { id: string; path: string; status: string; title?: string; content: PageOverride }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SettingRow { id: string; key: string; value: { items?: any[] } }

// Track intentionally-cleared top-level fields so an editor's blank wins over
// the static default (see mergePageOverride's `cleared` tombstone).
const trackCleared = (next: PageOverride, path: string, v: unknown): PageOverride => {
  if (typeof path !== "string" || path.includes(".") || path === "cleared" || !(PAGE_OVERRIDE_KEYS as string[]).includes(path)) return next;
  const emptied = v === null || v === undefined || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);
  const set = new Set(next.cleared ?? []);
  if (emptied) set.add(path); else set.delete(path);
  return { ...next, cleared: set.size ? Array.from(set) : undefined };
};

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
  const role = auth.status === "editor" ? auth.editor.role : "viewer";
  const canEdit = isEditor && role !== "viewer";        // viewers are read-only
  const canPublish = role === "admin" || role === "editor"; // authors save drafts only
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
  const [preview, setPreview] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const saveDraftRef = useRef<() => void>(() => {});   // latest save-draft action for the Ctrl+S shortcut
  const [hist, setHist] = useState<{ stack: PageOverride[]; idx: number }>({ stack: [{}], idx: 0 });
  const [saving, setSaving] = useState(false);
  const working = hist.stack[hist.idx];
  const dirty = hist.idx > 0;
  const canUndo = hist.idx > 0;
  const canRedo = hist.idx < hist.stack.length - 1;
  const commit = (next: PageOverride) => setHist((h) => { const stack = [...h.stack.slice(0, h.idx + 1), next]; return { stack, idx: stack.length - 1 }; });
  const undo = () => setHist((h) => (h.idx > 0 ? { ...h, idx: h.idx - 1 } : h));
  const redo = () => setHist((h) => (h.idx < h.stack.length - 1 ? { ...h, idx: h.idx + 1 } : h));

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

  const mutateBlocks = (fn: (blocks: PageBlock[]) => PageBlock[]) => commit({ ...working, blocks: fn(working.blocks ?? []) });

  const ctx = useMemo(() => ({
    editing: editing && !preview,   // preview renders blocks in visitor (view) mode
    set: (p: string, v: unknown) => commit(trackCleared(setPath(working, p, v), p, v)),
    get: (p: string) => getPath(working, p),
    addBlock: (slot: string, type: BlockType) => mutateBlocks((blocks) => [...blocks, { ...newBlock(type), slot }]),
    updateBlock: (id: string, patch: Partial<PageBlock>) => mutateBlocks((blocks) => blocks.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    moveBlock: (id: string, dir: -1 | 1) => mutateBlocks((blocks) => moveBlockInList(blocks, id, dir, slotOrder)),
    duplicateBlock: (id: string) => mutateBlocks((blocks) => {
      const i = blocks.findIndex((b) => b.id === id);
      if (i < 0) return blocks;
      return [...blocks.slice(0, i + 1), regenIds(blocks[i]), ...blocks.slice(i + 1)];
    }),
    removeBlock: (id: string) => mutateBlocks((blocks) => blocks.filter((b) => b.id !== id)),
    insertTemplate: (slot: string, block: PageBlock) => mutateBlocks((blocks) => [...blocks, { ...regenIds(block), slot }]),
    saveTemplate: async (block: PageBlock, name: string) => {
      try {
        const rows = await listRows<SettingRow>("site_settings");
        const row = rows.find((r) => r.key === "block-templates");
        const items = row?.value?.items ?? [];
        const tpl = { id: newId(), name, block: { ...structuredClone(block), id: "", slot: "" } };
        const value = { items: [...items, tpl] };
        const payload = { key: "block-templates", value, updated_at: new Date().toISOString() };
        if (row) await updateRow("site_settings", row.id, payload); else await insertRow("site_settings", payload);
        qc.invalidateQueries({ queryKey: ["site-setting", "block-templates"] });
        toast.success(`Saved "${name}" to templates`);
      } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't save template."); }
    },
    deleteTemplate: async (id: string) => {
      try {
        const rows = await listRows<SettingRow>("site_settings");
        const row = rows.find((r) => r.key === "block-templates");
        if (!row) return;
        const value = { items: (row.value?.items ?? []).filter((t) => t.id !== id) };
        await updateRow("site_settings", row.id, { value, updated_at: new Date().toISOString() });
        qc.invalidateQueries({ queryKey: ["site-setting", "block-templates"] });
      } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't delete template."); }
    },
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
  }), [editing, preview, working, slotOrder]);

  const startEdit = () => {
    // Snapshot the current effective content so every field/path exists to edit.
    const effective = mergePageOverride(props as PageOverride, baseOverride) as Record<string, unknown>;
    setHist({ stack: [pickPageOverride(effective)], idx: 0 });
    setEditing(true);
  };

  const cancel = () => { setEditing(false); setPreview(false); setHist({ stack: [{}], idx: 0 }); };

  // Keyboard undo/redo — but never when typing in a field/contentEditable (let
  // the browser handle text undo there).
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      // Ctrl/Cmd+S saves a draft — works even while typing in a field. Blur the
      // active field first so a blur-commit contentEditable (InlineText) flushes
      // its pending text into `working`, then save on the next frame (after the
      // commit re-renders and reassigns saveDraftRef).
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const active = document.activeElement as HTMLElement | null;
        if (active && (active.isContentEditable || active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
          active.blur();
          requestAnimationFrame(() => saveDraftRef.current());
        } else {
          saveDraftRef.current();
        }
        return;
      }
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      else if (k === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  // Warn before a refresh/tab-close would discard unsaved edits.
  useEffect(() => {
    if (!(editing && dirty)) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [editing, dirty]);

  const save = async (status: "draft" | "published", contentOverride?: PageOverride) => {
    setSaving(true);
    try {
      const rows = await listRows<PageRow>("site_pages");
      const existing = rows.find((r) => r.path === path);
      const title = label ?? EDITABLE_PAGES.find((p) => p.path === path)?.label ?? existing?.title ?? path;
      const payload = { path, title, status, content: contentOverride ?? working, updated_at: new Date().toISOString() };
      if (existing) await updateRow("site_pages", existing.id, payload);
      else await insertRow("site_pages", payload);
      qc.invalidateQueries({ queryKey: ["site-page", path] });
      qc.invalidateQueries({ queryKey: ["editor-page-row", path] });
      toast.success(status === "published" ? "Page published" : "Draft saved");
      setEditing(false);
      setPreview(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };
  // Keep the Ctrl+S shortcut pointed at the latest save with the latest content.
  saveDraftRef.current = () => { if (editing && !saving && dirty) save("draft"); };

  // Discard every CMS override for this page and restore the built-in content.
  const resetPage = async () => {
    if (!window.confirm("Reset this page to its original content?\n\nThis clears ALL CMS edits for this page — text, blocks, styles, and SEO — and restores the built-in content. This can't be undone.")) return;
    await save("published", {});
    setHist({ stack: [{}], idx: 0 });
  };

  const ov = rendered as PageOverride;
  const fallbackTitle = ov.title;
  const fallbackDesc = typeof ov.intro === "string" ? ov.intro : undefined;
  const seoTitle = ov.seo?.title || (fallbackTitle ? `${fallbackTitle} — Electrifying the US` : undefined);
  const seoDesc = ov.seo?.description || (fallbackDesc ? fallbackDesc.slice(0, 160) : undefined);
  const seoImage = ov.seo?.image || undefined;

  return (
    <InlineEditContext.Provider value={ctx}>
      <SeoHead title={seoTitle} description={seoDesc} image={seoImage} />
      <ContentPageLayout {...rendered} />
      {editing && !preview && <OutlinePanel blocks={working.blocks ?? []} />}
      {editing && !preview && seoOpen && (
        <SeoModal
          seo={working.seo ?? {}}
          fallbackTitle={fallbackTitle}
          fallbackDescription={fallbackDesc}
          onChange={(seo) => commit({ ...working, seo })}
          onClose={() => setSeoOpen(false)}
        />
      )}
      {canEdit && (
        <EditBar
          editing={editing}
          previewing={preview}
          dirty={dirty}
          saving={saving}
          canUndo={canUndo}
          canRedo={canRedo}
          canPublish={canPublish}
          onUndo={undo}
          onRedo={redo}
          onEdit={startEdit}
          onCancel={cancel}
          onSaveDraft={() => save("draft")}
          onPublish={() => save("published")}
          onSeo={() => setSeoOpen(true)}
          onReset={resetPage}
          onTogglePreview={() => setPreview((p) => !p)}
        />
      )}
    </InlineEditContext.Provider>
  );
};

export default EditableContentPage;
