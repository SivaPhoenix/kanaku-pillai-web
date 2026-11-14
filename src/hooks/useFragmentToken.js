import { useEffect, useState } from "react";
import { readFragmentToken, stripFragment } from "../lib/link-token.js";

// Holds the link token in state and removes it from the address bar right after mount; null means an unusable link.
export function useFragmentToken() {
  const [token] = useState(readFragmentToken);
  useEffect(stripFragment, []);
  return token;
}
