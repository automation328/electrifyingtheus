import { Component, type ReactNode } from "react";

// Plain markup with inline styles: it shows when the site's own code failed to
// download, so it can't lean on components or CSS from those chunks.
export const LoadFailed = () => (
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
  </div>
);

/** Catches a page chunk that still failed after importWithRetry's retries and reload. */
export class ChunkErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.error("Page failed to load", err);
  }
  render() {
    return this.state.failed ? <LoadFailed /> : this.props.children;
  }
}
