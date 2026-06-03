import type { CSSProperties } from "react";

interface IconProps {
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/**
 * Bold gas-pump nozzle silhouette (fuel gun) — matches the heavy-weight
 * reference art. Single-color, fills with `currentColor`.
 */
export const GasNozzleIcon = ({ className, style, title }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="currentColor" className={className} style={style} role="img" aria-label={title ?? "Gasoline"}>
    {title ? <title>{title}</title> : null}
    {/* spout */}
    <rect x="2" y="26.5" width="23" height="7" rx="3.5" />
    {/* nozzle neck */}
    <path d="M23 22h5v16h-5z" />
    {/* grip body */}
    <rect x="26" y="19" width="24" height="23" rx="9" />
    {/* trigger guard */}
    <path d="M31 42v6a7 7 0 0 0 7 7h3a3 3 0 0 0 3-3v-1a3 3 0 0 0-3-3h-2a2.5 2.5 0 0 1-2.5-2.5V42z" />
    {/* rear collar */}
    <rect x="46" y="22" width="9" height="17" rx="4" />
    {/* hose loop to the pump */}
    <path d="M55 25c4.5 0 7 3 7 8v16a3 3 0 1 1-6 0V33c0-1-.6-2-1.6-2H53a3 3 0 0 1 0-6z" />
  </svg>
);

/**
 * Matching EV charging connector (J1772-style charge gun) — same grip
 * geometry as the fuel nozzle, but with plug prongs instead of a spout and
 * a charge cable instead of a fuel hose. Single-color, `currentColor`.
 */
export const EvChargerIcon = ({ className, style, title }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="currentColor" className={className} style={style} role="img" aria-label={title ?? "Electric"}>
    {title ? <title>{title}</title> : null}
    {/* plug prongs */}
    <rect x="2" y="23" width="8" height="3.6" rx="1.8" />
    <rect x="2" y="30.2" width="8" height="3.6" rx="1.8" />
    <rect x="2" y="37.4" width="8" height="3.6" rx="1.8" />
    {/* connector head */}
    <rect x="10" y="19" width="16" height="23" rx="6" />
    {/* grip body */}
    <rect x="26" y="19" width="24" height="23" rx="9" />
    {/* lightning bolt embossed on the grip */}
    <path d="M40 23l-7 9h4.2l-2.4 7 7.2-9.6H37.8z" fill="#fff" fillOpacity="0.92" />
    {/* trigger guard */}
    <path d="M31 42v6a7 7 0 0 0 7 7h3a3 3 0 0 0 3-3v-1a3 3 0 0 0-3-3h-2a2.5 2.5 0 0 1-2.5-2.5V42z" />
    {/* rear collar */}
    <rect x="46" y="22" width="9" height="17" rx="4" />
    {/* charge cable */}
    <path d="M55 25c4.5 0 7 3 7 8v16a3 3 0 1 1-6 0V33c0-1-.6-2-1.6-2H53a3 3 0 0 1 0-6z" />
  </svg>
);
