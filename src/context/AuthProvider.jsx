import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { authApi } from "../lib/auth-api.js";
import { clearSession, onSignedOut, refreshSession, setAccessToken } from "../lib/session.js";
import { AuthContext } from "./auth-context.js";

const initialState = { status: "loading", user: null };

function reducer(state, action) {
  switch (action.type) {
    case "signedIn":
      return { status: "authenticated", user: action.user };
    case "userUpdated":
      return { ...state, user: action.user };
    case "signedOut":
      return { status: "unauthenticated", user: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const queryClient = useQueryClient();

  const signOutLocally = useCallback(() => {
    clearSession();
    queryClient.clear();
    dispatch({ type: "signedOut" });
  }, [queryClient]);

  // On load, the httpOnly refresh cookie (if any) restores the session without asking the user to sign in again.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const restored = await refreshSession();
      if (cancelled) return;
      if (!restored) return dispatch({ type: "signedOut" });
      try {
        const user = await authApi.me();
        if (!cancelled) dispatch({ type: "signedIn", user });
      } catch {
        if (!cancelled) signOutLocally();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signOutLocally]);

  useEffect(() => onSignedOut(signOutLocally), [signOutLocally]);

  const startSession = useCallback((result) => {
    setAccessToken(result.accessToken);
    dispatch({ type: "signedIn", user: result.user });
    return result;
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login: async (values) => startSession(await authApi.login(values)),
      signup: async (values) => startSession(await authApi.signup(values)),
      loginWithGoogle: async (idToken) => startSession(await authApi.google(idToken)),
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          signOutLocally();
        }
      },
      refreshUser: async () => {
        const user = await authApi.me();
        dispatch({ type: "userUpdated", user });
        return user;
      },
    }),
    [state, startSession, signOutLocally],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
