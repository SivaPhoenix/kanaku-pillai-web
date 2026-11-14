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
  requestPasswordReset: (email) => api.post("/auth/forgot-password", { email }, { auth: false }),
  checkResetToken: (token) => api.post("/auth/reset-password/check", { token }, { auth: false }),
  resetPassword: ({ token, password }) =>
    api.post("/auth/reset-password", { token, password }, { auth: false }),
  verifyEmail: (token) => api.post("/auth/verify-email", { token }, { auth: false }),
  resendVerificationEmail: () => api.post("/me/verify-email"),
  // Signed in: the only /auth call that sends the bearer token.
  changePassword: ({ currentPassword, newPassword }) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};
