// Drop-in replacement for <ContentPageLayout> that adds (a) the CMS prose/photo
// override for a page and (b) WordPress-style on-page editing for signed-in
// editors. Pages swap `ContentPageLayout` → `EditableContentPage` and add a
// `path`; everything else stays as passed.

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ContentPageLayout from "@/components/ContentPageLayout";
import EditBar from "@/components/inline/EditBar";
import Inspector from "@/components/inline/Inspector";
import SeoModal from "@/components/inline/SeoModal";
import SeoHead from "@/components/SeoHead";
import { InlineEditContext, setPath, getPath } from "@/components/inline/edit-context";
import { usePageOverride, mergePageOverride, pickPageOverride, EDITABLE_PAGES, type PageOverride, type PageBlock, type BlockType } from "@/lib/page-content";
import { newBlock, newId, regenIds } from "@/components/inline/blocks/factory";
import {
  trackCleared, moveBlockInList, patchBlockDeep, removeBlockDeep, duplicateBlockDeep, moveBlockRelativeInList,
} from "@/components/inline/block-ops";
import { useEditorAuth } from "@/lib/auth";
import { listRows, insertRow, updateRow } from "@/lib/admin-api";

type LayoutProps = React.ComponentProps<typeof ContentPageLayout>;

interface PageRow { id: string; path: string; status: string; title?: string; content: PageOverride }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SettingRow { id: string; key: string; value: { items?: any[] } }

// The block-list edits live in inline/block-ops so the blog-post editor uses
// exactly the same ones (see InlinePageEditor).

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
  const [activeId, setActiveId] = useState<string | null>(null);
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
    // "hero" comes first: it sits inside the hero band, above everything else.
    return ["hero", "after-stats", ...Array.from({ length: n }, (_, i) => `after-section-${i}`), "end"];
  }, [props]);

  const mutateBlocks = (fn: (blocks: PageBlock[]) => PageBlock[]) => commit({ ...working, blocks: fn(working.blocks ?? []) });

  const ctx = useMemo(() => ({
    editing: editing && !preview,   // preview renders blocks in visitor (view) mode
    activeId,
    setActive: setActiveId,
    set: (p: string, v: unknown) => commit(trackCleared(setPath(working, p, v), p, v)),
    setMany: (patch: Record<string, unknown>) => {
      // Honor the cleared-tombstone per key so emptying a field (e.g. deleting
      // every section → sections:[]) sticks instead of falling back to the
      // static default in mergePageOverride.
      let next: PageOverride = { ...working, ...patch };
      for (const [k, v] of Object.entries(patch)) next = trackCleared(next, k, v);
      commit(next);
    },
    get: (p: string) => getPath(working, p),
    addBlock: (slot: string, type: BlockType) => mutateBlocks((blocks) => [...blocks, { ...newBlock(type), slot }]),
    updateBlock: (id: string, patch: Partial<PageBlock>) => mutateBlocks((blocks) => patchBlockDeep(blocks, id, patch)),
    moveBlock: (id: string, dir: -1 | 1) => mutateBlocks((blocks) => moveBlockInList(blocks, id, dir, slotOrder)),
    duplicateBlock: (id: string) => mutateBlocks((blocks) => duplicateBlockDeep(blocks, id)),
    removeBlock: (id: string) => mutateBlocks((blocks) => removeBlockDeep(blocks, id)),
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
    moveBlockRelative: (dragId: string, targetId: string, before: boolean) =>
      mutateBlocks((blocks) => moveBlockRelativeInList(blocks, dragId, targetId, before)),
  }), [editing, preview, working, slotOrder, activeId]);

  const startEdit = () => {
    // Snapshot the current effective content so every field/path exists to edit.
    const effective = mergePageOverride(props as PageOverride, baseOverride) as Record<string, unknown>;
    setHist({ stack: [pickPageOverride(effective)], idx: 0 });
    setEditing(true);
  };

  const cancel = () => { setEditing(false); setPreview(false); setActiveId(null); setHist({ stack: [{}], idx: 0 }); };

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

  // With the Inspector docked on the left, the page used to sit UNDER it — the
  // left edge of the design (and the start of every headline) was hidden. The
  // shift class moves the whole page into the space beside the panel; its
  // transform also makes it the containing block for the fixed navbar and edit
  // bar, so those move with it instead of staying behind the panel.
  const shifted = editing && !preview;

  return (
    <InlineEditContext.Provider value={ctx}>
      <SeoHead title={seoTitle} description={seoDesc} image={seoImage} />
      <div className={shifted ? "cms-editor-shift" : undefined}>
      <ContentPageLayout {...rendered} />
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
      </div>
      {/* Outside the shift wrapper: the panel IS the thing the page moves aside for. */}
      {shifted && <Inspector blocks={working.blocks ?? []} slots={slotOrder} />}
    </InlineEditContext.Provider>
  );
};

export default EditableContentPage;
