/**
 * The one place that talks to the backend.
 *
 * The access token lives in memory, never in localStorage, so injected scripts
 * cannot read it from storage. The long-lived refresh token is an httpOnly cookie.
 * Because this module holds the token, components never re-run effects when it
 * refreshes.
 */
export const API_BASE = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let accessToken = null;
let refreshInFlight = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

const send = async (path, { method = "GET", body, token }) => {
  try {
    return await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("We can't reach the server. Check your connection and try again.", 0);
  }
};

const toError = async (response) => {
  const data = await response.json().catch(() => null);
  const message =
    data?.message ??
    (response.status >= 500
      ? "The server is waking up. Please try again in a moment."
      : "Something went wrong. Please try again.");
  return new ApiError(message, response.status, data?.code);
};

/** Exchanges the refresh cookie for a session. All callers share one request. */
export const refreshSession = () => {
  refreshInFlight ??= (async () => {
    try {
      const response = await send("/auth/refresh", { method: "POST" });
      if (!response.ok) throw await toError(response);
      const session = await response.json();
      accessToken = session.accessToken;
      return session;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
};

const authedResponse = async (path, options) => {
  let response = await send(path, { ...options, token: accessToken });

  if (response.status === 401 && options.auth !== false) {
    try {
      await refreshSession();
    } catch {
      accessToken = null;
      window.dispatchEvent(new Event("vreality:session-lost"));
      throw new ApiError("Please sign in again.", 401, "NO_SESSION");
    }
    response = await send(path, { ...options, token: accessToken });
  }

  if (!response.ok) throw await toError(response);
  return response;
};

export const api = async (path, options = {}) => {
  const response = await authedResponse(path, options);
  return response.json();
};

/** Downloads a protected file through the browser's save dialog. */
export const downloadFile = async (path, filename) => {
  const response = await authedResponse(path, {});
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
