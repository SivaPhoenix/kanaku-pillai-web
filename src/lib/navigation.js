// Navigation items per shell (design spec §5.1). `icon` names come from src/lib/icons.js.
export const NAV_ITEMS = Object.freeze([
  { to: "/month", label: "Month", icon: "month" },
  { to: "/daily", label: "Daily", icon: "daily" },
  { to: "/stats", label: "Stats", icon: "stats" },
  { to: "/accounts", label: "Accounts", icon: "accounts" },
  { to: "/search", label: "Search", icon: "search" },
  { to: "/lists", label: "Lists", icon: "lists" },
  { to: "/settings", label: "Settings", icon: "settings" },
]);

const pick = (...paths) => NAV_ITEMS.filter((item) => paths.includes(item.to));

// Phone tab bar: Month, Daily, [FAB], Stats, Accounts. Settings and Search live in page headers.
export const PHONE_TABS = Object.freeze({
  left: pick("/month", "/daily"),
  right: pick("/stats", "/accounts"),
});

// Tablet rail: icon-only, no Lists (reached from Settings).
export const RAIL_ITEMS = Object.freeze(
  pick("/month", "/daily", "/stats", "/accounts", "/search", "/settings"),
);

// Desktop and large sidebar: everything, labelled.
export const SIDEBAR_ITEMS = NAV_ITEMS;
