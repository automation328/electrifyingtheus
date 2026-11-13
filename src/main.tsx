import { createRoot } from "react-dom/client";
import "./index.css";
import { hydrateStaticContent } from "./lib/content-hydrate";
import { importWithRetry, reloadOnce } from "./lib/chunk-retry";

// Glass is the permanent site theme — set before first paint to avoid a flash.
document.documentElement.setAttribute("data-theme", "glass");

const root = createRoot(document.getElementById("root")!);

// Vite fires this when a chunk's preloaded CSS/JS fails (e.g. a stale tab after a
// deploy). Reload once to pick up the current build instead of throwing.
window.addEventListener("vite:preloadError", (e) => {
  if (reloadOnce()) e.preventDefault();
});

// Merge any CMS overrides into the static vehicle/incentive datasets BEFORE the
// app (and its synchronous consumers of those datasets) is imported. Time-boxed
// and non-throwing, so a slow/failed fetch just renders the static content.
hydrateStaticContent().finally(async () => {
  try {
    const { default: App } = await importWithRetry(() => import("./App.tsx"));
    root.render(<App />);
  } catch (err) {
    console.error("App failed to load", err);
    // Plain markup: the app's components are in the chunk that failed.
    root.render(
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <div>
          <p style={{ fontSize: 18, marginBottom: 12 }}>The page didn't finish loading. Please check your connection and try again.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 20px", borderRadius: 8, border: 0, background: "#0f766e", color: "#fff", fontSize: 16, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </div>,
    );
  }
});
