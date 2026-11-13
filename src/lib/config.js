// Build-time public config. Only VITE_* variables reach the browser, so nothing here may be secret.
export const config = Object.freeze({
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || null,
  appVersion: import.meta.env.VITE_APP_VERSION ?? "0.1.0",
});
