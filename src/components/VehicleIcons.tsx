// Vehicle-class icons for the EV-vs-gas class picker. Outline (stroke) glyphs in
// the lucide house style — thin strokes, rounded joins, open interiors — so they
// sit beside the rest of the UI's lucide icons and stay crisp at ~20px. Each is a
// proper side-view silhouette (sedan / crossover / full SUV / pickup), not a bus
// or box-truck stand-in. Shared wheels + chassis baseline keep the set a family;
// only the greenhouse/bed profile changes per class.

type IconProps = { className?: string };

const Svg = ({ className, children }: IconProps & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
    focusable="false"
  >
    {children}
  </svg>
);

// Two road wheels + the chassis line between them — identical on every vehicle.
const Chassis = () => (
  <>
    <path d="M9 16.5h6" />
    <circle cx="7" cy="16.5" r="2" />
    <circle cx="17" cy="16.5" r="2" />
  </>
);

// Compact sedan — short three-box, low roof.
export const SedanCompact = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3.6 16.5v-3a.7.7 0 0 1 .7-.7h1.1l1.8-2.9a1.1 1.1 0 0 1 .94-.5h4.9a1.1 1.1 0 0 1 .94.5l1.8 2.9h1.1a.7.7 0 0 1 .7.7v3" />
    <path d="M5.4 12.8h13.2" />
    <Chassis />
  </Svg>
);

// Mid-size sedan — longer body and cabin.
export const SedanMid = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M2.6 16.5v-3.2a.8.8 0 0 1 .8-.8h1.4l2-3.1a1.2 1.2 0 0 1 1-.55h6.4a1.2 1.2 0 0 1 1 .55l2 3.1h1.4a.8.8 0 0 1 .8.8v3.2" />
    <path d="M4.8 12.5h14.4" />
    <Chassis />
  </Svg>
);

// Small SUV / crossover — taller greenhouse, short overhangs.
export const SuvSmall = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M2.7 16.5v-3.1a.8.8 0 0 1 .8-.8h1l1.7-4a1.1 1.1 0 0 1 1.02-.66h7.56a1.1 1.1 0 0 1 1.02.66l1.7 4h1a.8.8 0 0 1 .8.8v3.1" />
    <path d="M5.2 11.9h13.6" />
    <Chassis />
  </Svg>
);

// Full-size SUV — long, boxy, near-vertical pillars (replaces the old bus look).
export const SuvFull = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M2.6 16.5v-3a.8.8 0 0 1 .8-.8h.9l1.2-5a1 1 0 0 1 .97-.76h11.06a1 1 0 0 1 .97.76l1.2 5h.9a.8.8 0 0 1 .8.8v3" />
    <path d="M6.7 11.1h10.6" />
    <Chassis />
  </Svg>
);

// Electric pickup — tall cab on the left, open bed on the right.
export const Pickup = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M2.6 16.5v-3.2a.8.8 0 0 1 .8-.8h17.2a.8.8 0 0 1 .8.8v3.2" />
    {/* cab */}
    <path d="M5 12.5 6.5 8.6a1.1 1.1 0 0 1 1.03-.7h3.27a1 1 0 0 1 1 1v3.6" />
    {/* open bed */}
    <path d="M13 12.5v-1.7h7.2" />
    <Chassis />
  </Svg>
);
