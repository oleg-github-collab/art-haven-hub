const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

let accessToken: string | null = localStorage.getItem("access_token");

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  accessToken = null;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  noAuth?: boolean;
}

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, noAuth, ...init } = options;

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (!noAuth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh on 401
  if (res.status === 401 && !noAuth && accessToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${accessToken}`;
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      });
    }
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || res.statusText);
  }

  return data as T;
}

// Convenience methods
export const apiGet = <T>(path: string, opts?: RequestOptions) =>
  api<T>(path, { method: "GET", ...opts });

export const apiPost = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  api<T>(path, { method: "POST", body, ...opts });

export const apiPut = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  api<T>(path, { method: "PUT", body, ...opts });

export const apiDelete = <T>(path: string, opts?: RequestOptions) =>
  api<T>(path, { method: "DELETE", ...opts });
