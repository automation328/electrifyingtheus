// White ElectrifyingTheUS logo overlay, used as a corner watermark on gallery and
// media photos. Drop-shadow keeps it legible on light backgrounds too. Purely
// decorative — sits inside a `relative` parent and ignores pointer events. The
// `className` sets position + size (default: bottom-right); pass your own to move
// or resize it (no conflicting base classes).

import logoWhite from "@/assets/logo-white.png";

const LogoWatermark = ({ className = "bottom-1.5 right-1.5 w-[26%] max-w-[120px]" }: { className?: string }) => (
  <img
    src={logoWhite}
    alt=""
    aria-hidden
    loading="lazy"
    className={`pointer-events-none absolute z-[1] opacity-90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)] ${className}`}
  />
);

export default LogoWatermark;
