import { useEffect } from "react";

/** Marks the current page noindex while it is mounted. The SPA answers every
 *  URL with a 200, so a "not found" screen would otherwise be indexed as a page. */
const NoIndex = () => {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  return null;
};

export default NoIndex;
