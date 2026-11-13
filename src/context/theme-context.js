import { createContext } from "react";

// { mode: "system" | "light" | "dark", scheme: "light" | "dark", setMode }
export const ThemeContext = createContext(null);

export const THEME_STORAGE_KEY = "kp-theme";
export const THEME_MODES = ["system", "light", "dark"];
