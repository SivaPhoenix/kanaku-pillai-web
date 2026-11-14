import { getAccessToken, notifySignedOut, refreshSession } from "./session.js";

const API_BASE = "/api/v1";
const RETRYABLE_AUTH_CODES = new Set(["TOKEN_EXPIRED", "UNAUTHENTICATED"]);

// Mirrors the backend error envelope { error: { code, message, details, requestId } }.
export class ApiError extends Error {
  constructor({ status, code, message, details, requestId }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details ?? [];
    this.requestId = requestId ?? null;
  }
}

async function parseError(res) {
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON error bodies (proxy pages, gateway errors) fall through to the generic message.
  }
  const error = payload?.error;
  return new ApiError({
    status: res.status,
    code: error?.code ?? (res.status >= 500 ? "INTERNAL" : "UNKNOWN"),
    message: error?.message ?? "Something went wrong. Try again.",
    details: error?.details,
    requestId: error?.requestId ?? res.headers.get("X-Request-Id"),
  });
}

// Calls the API on this origin (the dev proxy / reverse proxy forwards /api).
// responseType: "data" (default) returns the envelope's `data`; "envelope" returns { data, page }; "blob" returns
// { blob, headers } for file downloads. Extra `headers` with undefined values are skipped.
export async function apiRequest(
  path,
  {
    method = "GET",
    body,
    auth = true,
    signal,
    headers: extraHeaders = {},
    responseType = "data",
  } = {},
) {
  let tokenUsed = null;
  const send = () => {
    const headers = { Accept: "application/json", "X-Client-Platform": "web" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    for (const [name, value] of Object.entries(extraHeaders)) {
      if (value !== undefined && value !== null) headers[name] = value;
    }
    tokenUsed = auth ? getAccessToken() : null;
    if (tokenUsed) headers.Authorization = `Bearer ${tokenUsed}`;
    return fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      signal,
    });
  };

  let res;
  try {
    res = await send();
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Can't reach Kanaku Pillai. Check your connection and try again.",
    });
  }

  if (res.status === 401 && auth) {
    const error = await parseError(res);
    if (!RETRYABLE_AUTH_CODES.has(error.code)) throw error;
    // Another request may already have refreshed while this one was in flight; then just retry with the newer token.
    const current = getAccessToken();
    if ((current && current !== tokenUsed) || (await refreshSession())) {
      res = await send();
    } else {
      notifySignedOut();
      throw error;
    }
  }

  if (!res.ok) throw await parseError(res);
  if (responseType === "blob") return { blob: await res.blob(), headers: res.headers };
  // 202 (accepted, e.g. emails queued) and 204 carry no body.
  if (res.status === 202 || res.status === 204) return null;
  const payload = await res.json();
  return responseType === "envelope"
    ? { data: payload.data, page: payload.page ?? null }
    : payload.data;
}

// Downloads a file (CSV export) with the same auth and refresh handling as JSON calls.
export function apiDownload(path, options) {
  return apiRequest(path, { ...options, method: "GET", responseType: "blob" });
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: "GET" }),
  getPage: (path, options) =>
    apiRequest(path, { ...options, method: "GET", responseType: "envelope" }),
  post: (path, body, options) => apiRequest(path, { ...options, method: "POST", body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: "PATCH", body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: "PUT", body }),
  delete: (path, options) => apiRequest(path, { ...options, method: "DELETE" }),
};

// Maps `details` from a 400 VALIDATION_ERROR onto form field names ("body.email" → "email").
export function fieldErrors(error) {
  if (!(error instanceof ApiError) || error.code !== "VALIDATION_ERROR") return {};
  const result = {};
  for (const detail of error.details) {
    const field = detail.field?.split(".").slice(1).join(".");
    if (field && !result[field]) result[field] = detail.message;
  }
  return result;
}
