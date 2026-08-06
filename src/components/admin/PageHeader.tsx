// Shared header for the standalone CMS manager pages (Media, Users, Activity,
// Pages, KB, …) so they read as one product: a gradient icon badge, the title
// with an optional count pill, a subtitle, and optional right-aligned actions.

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  /** Small pill beside the title (e.g. an item count). Hidden when null/undefined. */
  count?: ReactNode;
  /** Right-aligned controls (buttons). */
  actions?: ReactNode;
  className?: string;
}

const PageHeader = ({ icon: Icon, title, subtitle, count, actions, className = "" }: Props) => (
  <div className={`flex flex-wrap items-start gap-3 mb-6 ${className}`}>
    <span className="w-10 h-10 rounded-xl gradient-hero grid place-items-center text-white shrink-0">
      <Icon className="w-5 h-5" />
    </span>
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold font-display text-foreground leading-none">{title}</h1>
        {count != null && count !== "" && (
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5 tabular-nums">{count}</span>
        )}
      </div>
      {subtitle && <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 ml-auto shrink-0">{actions}</div>}
  </div>
);

export default PageHeader;
