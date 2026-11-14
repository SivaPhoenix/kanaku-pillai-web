// After a new deploy, a tab still running the previous build asks for page chunks whose hashed names no longer
// exist (the host answers with index.html), so the lazy import fails. One automatic reload fetches the new build.

const RELOAD_KEY = "kp:stale-build-reload";
// A second failure within this window is a real error, not a stale build, so it is shown instead of reloading again.
const RELOAD_WINDOW_MS = 30_000;

const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|is not a valid JavaScript MIME type|Unable to preload CSS/i;

export function isChunkLoadError(error) {
  const message = typeof error === "string" ? error : (error?.message ?? "");
  return error?.name === "ChunkLoadError" || CHUNK_ERROR.test(message);
}

function readLastReload() {
  try {
    return Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
  } catch {
    return 0;
  }
}

// True when no stale-build reload happened in the last 30 seconds (so reloading now cannot loop).
export function canReloadForStaleBuild(now = Date.now()) {
  return now - readLastReload() >= RELOAD_WINDOW_MS;
}

// Returns true when it started a reload; false when one already happened moments ago (then show the error).
export function reloadOnceForStaleBuild({
  now = Date.now(),
  reload = () => window.location.reload(),
} = {}) {
  if (!canReloadForStaleBuild(now)) return false;
  try {
    sessionStorage.setItem(RELOAD_KEY, String(now));
  } catch {
    // Without storage we cannot tell a loop from a stale build, so do not risk reloading forever.
    return false;
  }
  reload();
  return true;
}
