import { useEffect } from "react";
import { isSpanish, setLanguage, startTranslation } from "@/lib/translate";

/** English / Español switch for the header. `notranslate` keeps Google from translating the labels. */
const LanguageToggle = ({ solid }: { solid: boolean }) => {
  const es = isSpanish();
  useEffect(startTranslation, []);

  const base = "px-2 py-1 rounded-md text-xs font-semibold transition-colors";
  const on = solid ? "bg-primary text-primary-foreground" : "bg-primary-foreground text-primary";
  const off = solid ? "text-foreground hover:bg-muted" : "text-primary-foreground/90 hover:bg-primary-foreground/10";

  return (
    <div
      className={`notranslate flex items-center gap-0.5 rounded-lg p-0.5 mr-2 border ${solid ? "border-border" : "border-primary-foreground/30"}`}
      translate="no"
      role="group"
      aria-label="Language / Idioma"
    >
      <button type="button" lang="en" className={`${base} ${es ? off : on}`} aria-pressed={!es} onClick={() => es && setLanguage("en")}>
        EN
      </button>
      <button type="button" lang="es" className={`${base} ${es ? on : off}`} aria-pressed={es} onClick={() => !es && setLanguage("es")}>
        ES
      </button>
    </div>
  );
};

export default LanguageToggle;
