// Centralized auth API calls + consistent error messaging.
// All auth requests go through the shared apiClient so base URL, headers and
// the global 429 handling stay in one place.

import apiClient from "@/lib/apiClient";

export async function loginRequest(username, password) {
  const { data } = await apiClient.post("/auth/login", { username, password });
  return data; // { token }
}

export async function registerRequest({ username, email, password, fullName }) {
  const { data } = await apiClient.post("/auth/register", {
    username,
    email,
    password,
    fullName,
  });
  return data; // { token }
}

export async function googleAuthRequest(credential) {
  const { data } = await apiClient.post("/auth/google", { credential });
  return data; // { token }
}

/** Turn an axios error into a friendly, user-facing message. */
export function authErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (err?.isRateLimit && err?.rateLimitMessage) return err.rateLimitMessage;

  const res = err?.response;
  if (res) {
    const status = res.status;
    const body = res.data;
    const msg =
      (body && typeof body === "object" && body.message) ||
      (typeof body === "string" && body) ||
      null;

    if (status === 400 && msg) return msg;
    if (status === 401 || status === 403) return "Invalid email or password.";
    if (status === 409) return "An account with this email already exists.";
    if (msg) return msg;
    if (status >= 500) return "Our servers had a hiccup. Please try again shortly.";
  }

  if (err?.code === "ERR_NETWORK") return "Can't reach the server. Check your connection and try again.";
  return fallback;
}

// --- lightweight client-side validators ---

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

export const PASSWORD_MIN = 8;
export const isValidPassword = (password) => String(password || "").length >= PASSWORD_MIN;
