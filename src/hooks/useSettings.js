import { useAuth } from "./useAuth.js";

const DEFAULTS = {
  currencyCode: "INR",
  locale: "en-IN",
  tzMode: "device",
  tzid: "Asia/Kolkata",
  theme: "system",
  weekStart: "mon",
};

// The signed-in user's formatting and calendar settings (currency, locale, zone, week start).
export function useSettings() {
  const { user } = useAuth();
  return { ...DEFAULTS, ...(user?.settings ?? {}) };
}
