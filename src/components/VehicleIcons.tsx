// Vehicle-class silhouettes for the EV-vs-gas class picker. Solid glyphs (one
// fill) so they read crisply at ~20px and stay legible on both the light card
// and the gradient "active" chip. Each shares the same body bar + wheels so the
// set looks like one family; only the cabin/bed profile differs by class.
//
// Authored as accurate side-view silhouettes (sedan / crossover / full SUV /
// pickup) — not lucide's bus/box-truck approximations.

type IconProps = { className?: string };

const Svg = ({ className, children }: IconProps & { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden focusable="false">
    {children}
  </svg>
);

// Two road wheels, shared by every vehicle.
const Wheels = ({ left = 7, right = 17 }: { left?: number; right?: number }) => (
  <>
    <circle cx={left} cy="16.6" r="2.15" />
    <circle cx={right} cy="16.6" r="2.15" />
  </>
);

// Compact sedan — short three-box, low roof.
export const SedanCompact = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3.5 12.4h17a1 1 0 0 1 1 1v1.2a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-1.2a1 1 0 0 1 1-1Z" />
    <path d="M8 12.4 9.6 9.3a1.3 1.3 0 0 1 1.15-.7h2.5a1.3 1.3 0 0 1 1.15.7L16 12.4Z" />
    <Wheels left="7" right="16.8" />
  </Svg>
);

// Mid-size sedan — longer body and cabin.
export const SedanMid = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M2.5 12.2h19a1 1 0 0 1 1 1v1.4a1 1 0 0 1-1 1h-19a1 1 0 0 1-1-1v-1.4a1 1 0 0 1 1-1Z" />
    <path d="M6.8 12.2 8.7 8.6a1.4 1.4 0 0 1 1.24-.74h4.12a1.4 1.4 0 0 1 1.24.74l1.9 3.6Z" />
    <Wheels left="7" right="17" />
  </Svg>
);

// Small SUV / crossover — taller greenhouse, shorter rear overhang.
export const SuvSmall = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M2.5 12.4h19a1 1 0 0 1 1 1v1.3a1 1 0 0 1-1 1h-19a1 1 0 0 1-1-1v-1.3a1 1 0 0 1 1-1Z" />
    <path d="M6.4 12.4 8 7.9a1.2 1.2 0 0 1 1.13-.8h6.4a1.2 1.2 0 0 1 1.1.74l1.8 4.56Z" />
    <Wheels left="7" right="17" />
  </Svg>
);

// Full-size SUV — long, boxy, near-vertical pillars (the one that used to look
// like a bus).
export const SuvFull = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M2.4 12.6h19.2a1 1 0 0 1 1 1v1.2a1 1 0 0 1-1 1H2.4a1 1 0 0 1-1-1v-1.2a1 1 0 0 1 1-1Z" />
    <path d="M5.2 12.6V8.1a1.1 1.1 0 0 1 1.1-1.1h11.4a1.1 1.1 0 0 1 1.1 1.1v4.5Z" />
    <Wheels left="6.8" right="17.2" />
  </Svg>
);

// Electric pickup — tall cab on the left, open bed on the right.
export const Pickup = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M2.5 12.4h19a1 1 0 0 1 1 1v1.3a1 1 0 0 1-1 1h-19a1 1 0 0 1-1-1v-1.3a1 1 0 0 1 1-1Z" />
    {/* cab */}
    <path d="M4.6 12.4 6 8.3a1.2 1.2 0 0 1 1.13-.8h3.4a1.2 1.2 0 0 1 1.2 1.2v3.7Z" />
    {/* bed side wall */}
    <path d="M12.8 12.4v-1.7a.8.8 0 0 1 .8-.8h6.1a.8.8 0 0 1 .8.8v1.7Z" />
    <Wheels left="7" right="17.4" />
  </Svg>
);
