/**
 * Rhizoh Centralized API Client.
 * Automatically resolves relative API in production or custom VITE_API_URL in development.
 * Zero hardcoded localhost references in production bundle.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const error = new Error(errData.error || errData.message || `HTTP ${res.status} ${res.statusText}`);
      error.status = res.status;
      error.data = errData;
      throw error;
    }
    return await res.json();
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[Rhizoh API] Error on ${options.method || "GET"} ${endpoint}:`, err.message);
    }
    throw err;
  }
}
