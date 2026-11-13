// Holds the access token in memory only (never localStorage) and refreshes it from the httpOnly cookie.

const REFRESH_LOCK = "kp-auth-refresh";

let accessToken = null;
let inflightRefresh = null;
const signedOutListeners = new Set();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token ?? null;
}

export function clearSession() {
  accessToken = null;
}

// Lets the auth provider react when a refresh fails mid-session (expired, revoked, replayed).
export function onSignedOut(listener) {
  signedOutListeners.add(listener);
  return () => signedOutListeners.delete(listener);
}

export function notifySignedOut() {
  clearSession();
  for (const listener of signedOutListeners) listener();
}

// Each refresh token works once, so refreshes must never overlap: one per tab via the in-flight promise, one across tabs via the Web Locks API.
function withCrossTabLock(fn) {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(REFRESH_LOCK, fn);
  }
  return fn();
}

async function requestRefresh() {
  const res = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "X-Client-Platform": "web" },
  });
  if (!res.ok) {
    clearSession();
    return false;
  }
  const body = await res.json();
  setAccessToken(body.data.accessToken);
  return true;
}

export function refreshSession() {
  inflightRefresh ??= withCrossTabLock(requestRefresh)
    .catch(() => {
      clearSession();
      return false;
    })
    .finally(() => {
      inflightRefresh = null;
    });
  return inflightRefresh;
}
