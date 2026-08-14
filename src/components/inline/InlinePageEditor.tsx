// On-page block editing for a page that is NOT a ContentPageLayout page.
//
// EditableContentPage bakes the builder into one specific layout. A blog post
// has its own design — hero, meta, markdown body, related posts — so it needs
// the same machinery wrapped around markup it keeps control of. This component
// owns the editor state and hands the blocks back to its child to place.
//
// Blocks are stored in `site_pages` keyed by the post's own path (/blog/<slug>).
// That means no migration and no change to site_blog_posts: the markdown body
// stays exactly where it is, and a post nobody has touched renders as before.

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import EditBar from "@/components/inline/EditBar";
import Inspector from "@/components/inline/Inspector";
import { InlineEditContext, setPath, getPath } from "@/components/inline/edit-context";
import { usePageOverride, type PageOverride, type PageBlock, type BlockType, type ElemStyle } from "@/lib/page-content";
import type { AdminTable } from "@/lib/admin-api";
import { newBlock, newId, regenIds } from "@/components/inline/blocks/factory";
import {
  trackCleared, moveBlockInList, patchBlockDeep, removeBlockDeep, duplicateBlockDeep, moveBlockRelativeInList,
} from "@/components/inline/block-ops";
import { useEditorAuth } from "@/lib/auth";
import { listRows, insertRow, updateRow } from "@/lib/admin-api";

interface PageRow { id: string; path: string; status: string; title?: string; content: PageOverride }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SettingRow { id: string; key: string; value: { items?: any[] } }

/**
 * The item's OWN fields — title, excerpt, body — which live in a content table,
 * not in site_pages. Editing those inline has to write back there, or the CMS
 * and the page would disagree about what the title is.
 */
export interface FieldTarget {
  /** Where the fields live, e.g. "site_blog_posts". */
  table: AdminTable;
  /** Row id. Absent for a curated item with no row yet — then we INSERT. */
  id?: string;
  /** The full row to insert when adopting a curated item. */
  adopt?: Record<string, unknown>;
  /** React Query key to refresh after saving, so the page shows the new value. */
  invalidate?: string;
}

/**
 * Multi-row variant of `fields`, for a page that shows MANY records at once.
 *
 * A blog post's page edits one row, so `fields` names one table and one id. The
 * incentives page shows dozens of programs from five different buckets, and each
 * card saves its own row — which row depends on the card, so only the page can
 * decide. Its edits are grouped in the draft as `fields.<key>.<column>` and
 * handed over whole.
 *
 * A page uses `fields` OR `fieldGroups`, never both: they occupy the same slot
 * in the draft.
 */
export interface FieldGroupTarget {
  save: (groups: Record<string, Record<string, string>>) => Promise<void>;
}

interface Props {
  /** Where the blocks are stored — the page's own URL path. */
  path: string;
  /** Title recorded on the site_pages row, so the CMS list is readable. */
  label: string;
  /** Insertion points this page offers, in the order they appear. */
  slots: string[];
  /** Optional: lets the page edit its own content-table fields inline. */
  fields?: FieldTarget;
  /** Optional: same, for a page whose cards are many rows rather than one. */
  fieldGroups?: FieldGroupTarget;
  /** Render the page. `blocks` go in the slots; `fieldEdits` are the pending
   *  edits to the item's own values (fall back to its stored values); `styles`
   *  are the per-element typography overrides, for PageStylesContext. */
  children: (
    blocks: PageBlock[],
    fieldEdits: Record<string, string>,
    styles: Record<string, ElemStyle> | undefined,
  ) => React.ReactNode;
}

const InlinePageEditor = ({ path, label, slots, fields, fieldGroups, children }: Props) => {
  const qc = useQueryClient();
  const auth = useEditorAuth();
  const isEditor = auth.status === "editor";
  const role = auth.status === "editor" ? auth.editor.role : "viewer";
  const canEdit = isEditor && role !== "viewer";
  const canPublish = role === "admin" || role === "editor";
  const published = usePageOverride(path);

  // Editors also load the row at ANY status, so a draft is visible to them.
  const editorRow = useQuery({
    queryKey: ["editor-page-row", path],
    queryFn: async () => (await listRows<PageRow>("site_pages")).find((r) => r.path === path) ?? null,
    enabled: isEditor,
    staleTime: 30_000,
  });
  const base = (isEditor ? (editorRow.data?.content ?? published) : published) ?? {};

  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hist, setHist] = useState<{ stack: PageOverride[]; idx: number }>({ stack: [{}], idx: 0 });
  const saveDraftRef = useRef<() => void>(() => {});
  const working = hist.stack[hist.idx];
  const dirty = hist.idx > 0;
  const commit = (next: PageOverride) => setHist((h) => { const stack = [...h.stack.slice(0, h.idx + 1), next]; return { stack, idx: stack.length - 1 }; });
  const undo = () => setHist((h) => (h.idx > 0 ? { ...h, idx: h.idx - 1 } : h));
  const redo = () => setHist((h) => (h.idx < h.stack.length - 1 ? { ...h, idx: h.idx + 1 } : h));

  const shown: PageOverride = editing ? working : (base as PageOverride);
  const mutateBlocks = (fn: (blocks: PageBlock[]) => PageBlock[]) => commit({ ...working, blocks: fn(working.blocks ?? []) });

  const ctx = useMemo(() => ({
    editing: editing && !preview,
    activeId,
    setActive: setActiveId,
    set: (p: string, v: unknown) => commit(trackCleared(setPath(working, p, v), p, v)),
    setMany: (patch: Record<string, unknown>) => {
      let next: PageOverride = { ...working, ...patch };
      for (const [k, v] of Object.entries(patch)) next = trackCleared(next, k, v);
      commit(next);
    },
    get: (p: string) => getPath(working, p),
    addBlock: (slot: string, type: BlockType) => mutateBlocks((blocks) => [...blocks, { ...newBlock(type), slot }]),
    updateBlock: (id: string, patch: Partial<PageBlock>) => mutateBlocks((blocks) => patchBlockDeep(blocks, id, patch)),
    moveBlock: (id: string, dir: -1 | 1) => mutateBlocks((blocks) => moveBlockInList(blocks, id, dir, slots)),
    duplicateBlock: (id: string) => mutateBlocks((blocks) => duplicateBlockDeep(blocks, id)),
    removeBlock: (id: string) => mutateBlocks((blocks) => removeBlockDeep(blocks, id)),
    insertTemplate: (slot: string, block: PageBlock) => mutateBlocks((blocks) => [...blocks, { ...regenIds(block), slot }]),
    moveBlockRelative: (dragId: string, targetId: string, before: boolean) =>
      mutateBlocks((blocks) => moveBlockRelativeInList(blocks, dragId, targetId, before)),
    saveTemplate: async (block: PageBlock, name: string) => {
      try {
        const rows = await listRows<SettingRow>("site_settings");
        const row = rows.find((r) => r.key === "block-templates");
        const items = row?.value?.items ?? [];
        const tpl = { id: newId(), name, block: { ...structuredClone(block), id: "", slot: "" } };
        const payload = { key: "block-templates", value: { items: [...items, tpl] }, updated_at: new Date().toISOString() };
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
        await updateRow("site_settings", row.id, { value: { items: (row.value?.items ?? []).filter((t) => t.id !== id) }, updated_at: new Date().toISOString() });
        qc.invalidateQueries({ queryKey: ["site-setting", "block-templates"] });
      } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't delete template."); }
    },
  }), [editing, preview, working, activeId, slots]);

  const startEdit = () => { setHist({ stack: [structuredClone(base as PageOverride)], idx: 0 }); setEditing(true); };
  const cancel = () => { setEditing(false); setPreview(false); setActiveId(null); setHist({ stack: [{}], idx: 0 }); };

  // Warn before a refresh would discard unsaved edits.
  useEffect(() => {
    if (!(editing && dirty)) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [editing, dirty]);

  // Ctrl/Cmd+S saves a draft; Ctrl+Z / Ctrl+Y undo/redo when not typing.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const active = document.activeElement as HTMLElement | null;
        if (active && (active.isContentEditable || active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
          active.blur();
          requestAnimationFrame(() => saveDraftRef.current());
        } else saveDraftRef.current();
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

  const save = async (status: "draft" | "published", contentOverride?: PageOverride) => {
    setSaving(true);
    try {
      // Split the draft: the item's OWN fields belong to its content table, the
      // rest (blocks, styles) to site_pages. `fields` is never written to
      // site_pages, so a title can't end up living in two places.
      const source = contentOverride ?? working;
      const { fields: fieldEdits, ...pageContent } = source as PageOverride & { fields?: Record<string, unknown> };

      if (fieldGroups && fieldEdits && Object.keys(fieldEdits).length > 0) {
        // Grouped edits: the page owns the row-by-row mapping. If this throws,
        // the page row below is never written — better to report a failed save
        // than to publish blocks while the card text is silently lost.
        await fieldGroups.save(fieldEdits as Record<string, Record<string, string>>);
      }

      if (fields && fieldEdits && Object.keys(fieldEdits).length > 0) {
        if (fields.id) {
          await updateRow(fields.table, fields.id, { ...fieldEdits, updated_at: new Date().toISOString() });
        } else {
          // A curated item has no row yet — adopt it, exactly as the CMS does.
          await insertRow(fields.table, { ...(fields.adopt ?? {}), ...fieldEdits, updated_at: new Date().toISOString() });
        }
        if (fields.invalidate) qc.invalidateQueries({ queryKey: [fields.invalidate] });
      }

      const rows = await listRows<PageRow>("site_pages");
      const existing = rows.find((r) => r.path === path);
      const payload = { path, title: label, status, content: pageContent as PageOverride, updated_at: new Date().toISOString() };
      if (existing) await updateRow("site_pages", existing.id, payload); else await insertRow("site_pages", payload);
      qc.invalidateQueries({ queryKey: ["site-page", path] });
      qc.invalidateQueries({ queryKey: ["editor-page-row", path] });
      toast.success(status === "published" ? "Published" : "Draft saved");
      setEditing(false);
      setPreview(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally { setSaving(false); }
  };
  saveDraftRef.current = () => { if (editing && !saving && dirty) save("draft"); };

  const reset = async () => {
    if (!window.confirm("Remove every block added to this post?\n\nThe post's own words and photo are not touched — only the blocks built here. This can't be undone.")) return;
    await save("published", {});
    setHist({ stack: [{}], idx: 0 });
  };

  const shifted = editing && !preview;

  return (
    <InlineEditContext.Provider value={ctx}>
      <div className={shifted ? "cms-editor-shift" : undefined}>
        {children(shown.blocks ?? [], (shown as { fields?: Record<string, string> }).fields ?? {}, shown.styles)}
        {canEdit && (
          <EditBar
            editing={editing}
            previewing={preview}
            dirty={dirty}
            saving={saving}
            canUndo={hist.idx > 0}
            canRedo={hist.idx < hist.stack.length - 1}
            canPublish={canPublish}
            onUndo={undo}
            onRedo={redo}
            onEdit={startEdit}
            onCancel={cancel}
            onSaveDraft={() => save("draft")}
            onPublish={() => save("published")}
            // A post's title, description and share image come from the post
            // itself, so there is no separate SEO panel to open here.
            onSeo={() => toast.message("Edit this post's SEO in the CMS — Blog posts → Edit post.")}
            onReset={reset}
            onTogglePreview={() => setPreview((p) => !p)}
          />
        )}
      </div>
      {shifted && <Inspector blocks={working.blocks ?? []} slots={slots} />}
    </InlineEditContext.Provider>
  );
};

export default InlinePageEditor;
