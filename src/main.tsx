import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply the saved site theme ("classic" | "glass") before first paint to avoid a flash.
try {
  const saved = localStorage.getItem("site-theme");
  if (saved === "glass") document.documentElement.setAttribute("data-theme", "glass");
} catch { /* localStorage unavailable */ }

createRoot(document.getElementById("root")!).render(<App />);
