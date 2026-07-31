// Renders one CMS form field from a FieldDef. Controlled — value + onChange come
// from the editor. The "image" type reuses ImageUpload (upload or paste URL);
// "markdown" adds a live preview toggle.

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Pencil } from "lucide-react";
import type { FieldDef } from "@/pages/admin/collections/types";
import ImageUpload from "@/components/admin/ImageUpload";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40";

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

const AdminField = ({ field, value, onChange }: Props) => {
  const [preview, setPreview] = useState(false);
  const label = (
    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
      {field.label}
      {field.required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
  const help = field.help && <p className="text-xs text-muted-foreground mt-1">{field.help}</p>;

  if (field.type === "boolean") {
    return (
      <div className="flex items-center gap-3 py-1">
        <button
          type="button"
          role="switch"
          aria-checked={!!value}
          onClick={() => onChange(!value)}
          className={`relative w-11 h-6 rounded-full transition-colors ${value ? "gradient-hero" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : ""}`} />
        </button>
        <span className="text-sm font-medium text-foreground">{field.label}</span>
        {field.help && <span className="text-xs text-muted-foreground">— {field.help}</span>}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        {label}
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {help}
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div>
        {label}
        <input
          type="number"
          value={value === "" || value === null || value === undefined ? "" : Number(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={field.placeholder}
          className={inputClass}
        />
        {help}
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <div>
        {label}
        <input
          type="date"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        {help}
      </div>
    );
  }

  if (field.type === "image") {
    return (
      <div>
        {label}
        <ImageUpload value={String(value ?? "")} onChange={(url) => onChange(url)} />
        {help}
      </div>
    );
  }

  if (field.type === "textarea" || field.type === "markdown") {
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </label>
          {field.type === "markdown" && (
            <button
              type="button"
              onClick={() => setPreview((p) => !p)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {preview ? <Pencil className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {preview ? "Edit" : "Preview"}
            </button>
          )}
        </div>
        {field.type === "markdown" && preview ? (
          <div className="prose prose-sm max-w-none rounded-xl border border-border bg-card p-4 min-h-[10rem] dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(value ?? "") || "_Nothing to preview_"}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={field.type === "markdown" ? 14 : 4}
            className={`${inputClass} font-mono leading-relaxed resize-y`}
          />
        )}
        {help}
      </div>
    );
  }

  // text
  return (
    <div>
      {label}
      <input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={inputClass}
      />
      {help}
    </div>
  );
};

export default AdminField;
