// Floating toolbar shown to signed-in editors on an editable page. Toggles edit
// mode and saves the working override as a draft or published.

import { Pencil, Save, Rocket, X, Loader2, Circle, Undo2, Redo2, Search, RotateCcw, Eye, PencilRuler } from "lucide-react";

interface Props {
  editing: boolean;
  previewing: boolean;
  dirty: boolean;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canPublish: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onSeo: () => void;
  onReset: () => void;
  onTogglePreview: () => void;
}

const EditBar = ({ editing, previewing, dirty, saving, canUndo, canRedo, canPublish, onUndo, onRedo, onEdit, onCancel, onSaveDraft, onPublish, onSeo, onReset, onTogglePreview }: Props) => {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90]">
      {!editing ? (
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-full gradient-hero text-white font-semibold px-5 py-3 text-sm shadow-elevated hover:opacity-90 transition-opacity"
        >
          <Pencil className="w-4 h-4" /> Edit this page
        </button>
      ) : previewing ? (
        <button
          onClick={onTogglePreview}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-white font-semibold px-5 py-3 text-sm shadow-elevated hover:opacity-90 transition-opacity"
        >
          <PencilRuler className="w-4 h-4" /> Previewing — back to editing
        </button>
      ) : (
        <div className="flex items-center gap-1.5 rounded-full border border-border surface backdrop-blur px-2 py-2 shadow-elevated">
          <span className="flex items-center gap-1.5 pl-2 pr-1 text-xs text-muted-foreground">
            <Circle className={`w-2 h-2 ${dirty ? "fill-amber-500 text-amber-500" : "fill-muted text-muted"}`} />
            {dirty ? "Unsaved" : "Editing"}
          </span>
          <button onClick={onUndo} disabled={!canUndo || saving} className="p-2 rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40" title="Undo"><Undo2 className="w-4 h-4" /></button>
          <button onClick={onRedo} disabled={!canRedo || saving} className="p-2 rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40" title="Redo"><Redo2 className="w-4 h-4" /></button>
          <button onClick={onTogglePreview} disabled={saving} className="p-2 rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40" title="Preview as a visitor"><Eye className="w-4 h-4" /></button>
          <button onClick={onSeo} disabled={saving} className="p-2 rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40" title="Page SEO & sharing"><Search className="w-4 h-4" /></button>
          {canPublish && <button onClick={onReset} disabled={saving} className="p-2 rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-40" title="Reset page to original content"><RotateCcw className="w-4 h-4" /></button>}
          <button onClick={onSaveDraft} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save draft
          </button>
          {canPublish && (
            <button onClick={onPublish} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full gradient-hero text-white px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              <Rocket className="w-4 h-4" /> Publish
            </button>
          )}
          <button onClick={onCancel} disabled={saving} className="p-2 rounded-full text-muted-foreground hover:bg-muted disabled:opacity-60" title="Exit without saving">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EditBar;
