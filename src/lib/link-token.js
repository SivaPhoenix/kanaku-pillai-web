// Email links carry their one-time token in the URL fragment so it never reaches a server or a Referer header.
export function readFragmentToken() {
  return new URLSearchParams(window.location.hash.slice(1)).get("token") || null;
}

export function stripFragment() {
  if (!window.location.hash) return;
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, "", pathname + search);
}
