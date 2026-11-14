import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./index.css";
import { reloadOnceForStaleBuild } from "./lib/stale-build.js";

// Vite fires this when a lazily loaded chunk (or its CSS) cannot be fetched, typically after a new deploy.
window.addEventListener("vite:preloadError", (event) => {
  if (reloadOnceForStaleBuild()) event.preventDefault();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
