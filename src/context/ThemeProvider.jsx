import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { THEME_MODES, THEME_STORAGE_KEY, ThemeContext } from "./theme-context.js";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function readStoredMode() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_MODES.includes(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function subscribeToSystemScheme(callback) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

const systemPrefersDark = () => window.matchMedia(DARK_QUERY).matches;

// Follows the OS setting live unless the user picks Light or Dark; index.html applies the same choice before first paint.
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readStoredMode);
  const prefersDark = useSyncExternalStore(subscribeToSystemScheme, systemPrefersDark, () => false);
  const scheme = mode === "system" ? (prefersDark ? "dark" : "light") : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = scheme;
  }, [scheme]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Private mode or blocked storage: the choice still applies for this visit.
    }
  }, [mode]);

  const value = useMemo(() => ({ mode, scheme, setMode }), [mode, scheme]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}
