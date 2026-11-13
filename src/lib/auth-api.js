import { api } from "./api.js";

// Auth endpoints (backend docs/api/README.md → Auth). The web never sees the refresh token: it lives in an httpOnly cookie.
export const authApi = {
  signup: ({ name, email, password }) =>
    api.post("/auth/signup", { name, email, password }, { auth: false }),
  login: ({ email, password, keepSignedIn }) =>
    api.post("/auth/login", { email, password, keepSignedIn }, { auth: false }),
  google: (idToken) => api.post("/auth/google", { idToken }, { auth: false }),
  logout: () => api.post("/auth/logout", undefined, { auth: false }),
  me: () => api.get("/me"),
};
