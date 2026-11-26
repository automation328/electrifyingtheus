import { useLocation } from "react-router-dom";
import JsonLd from "@/components/JsonLd";
import { ogFor } from "@/components/SeoHead";
import { TOOL_PATHS, webApplicationLd } from "@/lib/structured-data";

/** WebApplication data for the tool pages, named from their og-data.ts entry. */
const ToolSchema = () => {
  const path = useLocation().pathname.replace(/\/+$/, "") || "/";
  const og = ogFor(path);
  if (!og || !TOOL_PATHS.includes(path)) return null;
  // "EV Range Map — How Far Can Your EV Go?" → "EV Range Map"
  return <JsonLd data={webApplicationLd(path, og.title.split(" — ")[0], og.description)} />;
};

export default ToolSchema;
