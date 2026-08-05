// Floating toolbar shown to signed-in editors on an editable page. Toggles edit
// mode and saves the working override as a draft or published.

import { Pencil, Save, Rocket, X, Loader2, Circle, Undo2, Redo2 } from "lucide-react";

interface Props {
  editing: boolean;
  dirty: boolean;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

const EditBar = ({ editing, dirty, saving, canUndo, canRedo, onUndo, onRedo, onEdit, onCancel, onSaveDraft, onPublish }: Props) => {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90]">
      {!editing ? (
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-full gradient-hero text-white font-semibold px-5 py-3 text-sm shadow-elevated hover:opacity-90 transition-opacity"
        >
          <Pencil className="w-4 h-4" /> Edit this page
        </button>
      ) : (
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/95 backdrop-blur px-2 py-2 shadow-elevated">
          <span className="flex items-center gap-1.5 pl-2 pr-1 text-xs text-muted-foreground">
            <Circle className={`w-2 h-2 ${dirty ? "fill-amber-500 text-amber-500" : "fill-muted text-muted"}`} />
            {dirty ? "Unsaved" : "Editing"}
          </span>
          <button onClick={onUndo} disabled={!canUndo || saving} className="p-2 rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40" title="Undo"><Undo2 className="w-4 h-4" /></button>
          <button onClick={onRedo} disabled={!canRedo || saving} className="p-2 rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40" title="Redo"><Redo2 className="w-4 h-4" /></button>
          <button onClick={onSaveDraft} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save draft
          </button>
          <button onClick={onPublish} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full gradient-hero text-white px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
            <Rocket className="w-4 h-4" /> Publish
          </button>
          <button onClick={onCancel} disabled={saving} className="p-2 rounded-full text-muted-foreground hover:bg-muted disabled:opacity-60" title="Exit without saving">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EditBar;
