import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, fieldErrors } from "./api.js";
import { getAccessToken, onSignedOut, setAccessToken } from "./session.js";

const json = (status, body) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("apiRequest", () => {
  beforeEach(() => {
    setAccessToken("old-token");
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
  });

  it("sends the bearer token and platform header to the same-origin API and unwraps data", async () => {
    fetch.mockResolvedValueOnce(json(200, { data: { id: "u1" } }));
    await expect(apiRequest("/me")).resolves.toEqual({ id: "u1" });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("/api/v1/me");
    expect(init.headers.Authorization).toBe("Bearer old-token");
    expect(init.headers["X-Client-Platform"]).toBe("web");
    expect(init.credentials).toBe("same-origin");
  });

  it("refreshes once on TOKEN_EXPIRED and retries with the new token", async () => {
    fetch
      .mockResolvedValueOnce(json(401, { error: { code: "TOKEN_EXPIRED", message: "expired" } }))
      .mockResolvedValueOnce(json(200, { data: { accessToken: "new-token" } }))
      .mockResolvedValueOnce(json(200, { data: { ok: true } }));

    await expect(apiRequest("/me")).resolves.toEqual({ ok: true });
    expect(fetch.mock.calls[1][0]).toBe("/api/v1/auth/refresh");
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe("Bearer new-token");
    expect(getAccessToken()).toBe("new-token");
  });

  it("signs out when the refresh fails", async () => {
    const listener = vi.fn();
    const unsubscribe = onSignedOut(listener);
    fetch
      .mockResolvedValueOnce(json(401, { error: { code: "TOKEN_EXPIRED", message: "expired" } }))
      .mockResolvedValueOnce(json(401, { error: { code: "UNAUTHENTICATED", message: "no" } }));

    await expect(apiRequest("/me")).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    unsubscribe();
  });

  it("runs only one refresh for concurrent expired requests", async () => {
    fetch.mockImplementation(async (url, init) => {
      if (url === "/api/v1/auth/refresh") return json(200, { data: { accessToken: "fresh" } });
      return init.headers.Authorization === "Bearer fresh"
        ? json(200, { data: "ok" })
        : json(401, { error: { code: "TOKEN_EXPIRED", message: "expired" } });
    });

    await Promise.all([apiRequest("/a"), apiRequest("/b"), apiRequest("/c")]);
    const refreshCalls = fetch.mock.calls.filter(([url]) => url === "/api/v1/auth/refresh");
    expect(refreshCalls).toHaveLength(1);
  });

  it("turns error envelopes and network failures into ApiError", async () => {
    fetch.mockResolvedValueOnce(
      json(409, { error: { code: "EMAIL_TAKEN", message: "taken", requestId: "r1" } }),
    );
    await expect(apiRequest("/auth/signup", { method: "POST", auth: false })).rejects.toMatchObject(
      { status: 409, code: "EMAIL_TAKEN", requestId: "r1" },
    );

    fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(apiRequest("/me")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});

describe("fieldErrors", () => {
  it("maps validation details to form field names", () => {
    const error = new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "bad",
      details: [
        { field: "body.email", message: "Enter a valid email address" },
        { field: "body.password", message: "Include a symbol" },
      ],
    });
    expect(fieldErrors(error)).toEqual({
      email: "Enter a valid email address",
      password: "Include a symbol",
    });
  });
});
