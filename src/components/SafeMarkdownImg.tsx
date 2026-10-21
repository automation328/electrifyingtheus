import { isTrustedImageSrc, safeHref } from "@/lib/safe-href";

// react-markdown `img` override: untrusted hosts become a plain link the reader
// must click, instead of an image that loads (and leaks the visit) on render.
const SafeMarkdownImg = ({ src, alt }: { src?: string; alt?: string }) =>
  isTrustedImageSrc(src) ? (
    <img src={src} alt={alt ?? ""} loading="lazy" className="max-w-full h-auto rounded-lg" />
  ) : (
    <a href={safeHref(src)} target="_blank" rel="noopener noreferrer" className="underline">
      {alt || "image"}
    </a>
  );

export default SafeMarkdownImg;
