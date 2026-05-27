import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Glass is the permanent site theme — set before first paint to avoid a flash.
document.documentElement.setAttribute("data-theme", "glass");

createRoot(document.getElementById("root")!).render(<App />);
