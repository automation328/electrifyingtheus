import { createRoot } from "react-dom/client";
import "./index.css";
import { hydrateStaticContent } from "./lib/content-hydrate";

// Glass is the permanent site theme — set before first paint to avoid a flash.
document.documentElement.setAttribute("data-theme", "glass");

const root = createRoot(document.getElementById("root")!);

// Merge any CMS overrides into the static vehicle/incentive datasets BEFORE the
// app (and its synchronous consumers of those datasets) is imported. Time-boxed
// and non-throwing, so a slow/failed fetch just renders the static content.
hydrateStaticContent().finally(async () => {
  const { default: App } = await import("./App.tsx");
  root.render(<App />);
});
