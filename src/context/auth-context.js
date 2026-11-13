import { createContext } from "react";

// { status: "loading" | "authenticated" | "unauthenticated", user, login, signup, loginWithGoogle, logout, refreshUser }
export const AuthContext = createContext(null);
