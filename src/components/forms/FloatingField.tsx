import { type ComponentType, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

// Bolder form fields — floating labels, optional leading icon, larger touch
// targets, and a brand focus glow. Shared across every site form.
//
// The trick: the <input> uses placeholder=" " (a single space) so the
// `:placeholder-shown` selector is true only while empty. The label sits over
// the field and floats up the moment the field is focused or filled.

type Icon = ComponentType<{ className?: string }>;

const ICON =
  "pointer-events-none absolute left-4 top-[1.15rem] w-4 h-4 text-muted-foreground transition-colors peer-focus:text-primary z-10";

const field = (hasIcon: boolean) =>
  `peer w-full rounded-2xl border border-slate-200 bg-slate-50 ${hasIcon ? "pl-11" : "pl-4"} pr-4 pt-6 pb-2 text-[15px] text-foreground shadow-sm outline-none transition-all duration-200 placeholder-transparent hover:border-slate-300 focus:border-primary focus:bg-white focus:shadow-md focus:ring-4 focus:ring-primary/10`;

const FLOAT =
  "top-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary";
const REST = "top-[1.05rem] text-[15px] text-muted-foreground";

const label = (hasIcon: boolean) =>
  `absolute ${hasIcon ? "left-11" : "left-4"} transition-all duration-200 pointer-events-none
   peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-[0.12em] peer-focus:text-primary
   peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.12em] peer-[:not(:placeholder-shown)]:text-muted-foreground`;

type Base = { id: string; label: string; icon?: Icon; required?: boolean };

export function FloatingInput({
  id, label: lbl, icon: IconC, required, className = "", ...rest
}: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative ${className}`}>
      {IconC && <IconC className={ICON} />}
      <input id={id} placeholder=" " className={field(!!IconC)} {...rest} />
      <label htmlFor={id} className={`${label(!!IconC)} ${REST}`}>
        {lbl}{required && <span className="text-primary"> *</span>}
      </label>
    </div>
  );
}

export function FloatingTextarea({
  id, label: lbl, icon: IconC, required, className = "", rows = 5, ...rest
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={`relative ${className}`}>
      {IconC && <IconC className={`${ICON} top-5`} />}
      <textarea id={id} rows={rows} placeholder=" " className={`${field(!!IconC)} resize-y leading-relaxed`} {...rest} />
      <label htmlFor={id} className={`${label(!!IconC)} ${REST}`}>
        {lbl}{required && <span className="text-primary"> *</span>}
      </label>
    </div>
  );
}

// Selects always have a value, so the label stays floated. `placeholder` here is
// the disabled first option shown when nothing is chosen.
export function FloatingSelect({
  id, label: lbl, icon: IconC, required, className = "", placeholder, children, ...rest
}: Base & SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }) {
  return (
    <div className={`relative ${className}`}>
      {IconC && <IconC className={ICON} />}
      <select id={id} className={`${field(!!IconC)} cursor-pointer appearance-none`} {...rest}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {children}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
      <label htmlFor={id} className={`absolute ${IconC ? "left-11" : "left-4"} ${FLOAT}`}>
        {lbl}{required && <span className="text-primary"> *</span>}
      </label>
    </div>
  );
}
