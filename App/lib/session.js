// The saved login. The login token lives for minutes, so a token in storage proves
// nothing on its own. Everything reads it through here: an expiring token is renewed
// with the refresh cookie, and only a refused renewal ends the session.

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
const TOKEN_KEY = "token";
const SESSION_ENDED_EVENT = "auth:session-ended";
const EXPIRY_MARGIN_MS = 30_000; // renew early so a token can't die mid-request
const CLIENT_HEADERS = { "X-Requested-With": "genxai" }; // required by /auth/refresh and /auth/logout

let refreshInFlight = null;

function isExpiring(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return typeof exp !== "number" || exp * 1000 - EXPIRY_MARGIN_MS <= Date.now();
  } catch {
    return true; // unreadable, so it can't be a token we issued
  }
}

/** Removes the saved login and tells AuthProvider, so the UI updates straight away. */
export function endSession() {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function onSessionEnded(listener) {
  window.addEventListener(SESSION_ENDED_EVENT, listener);
  return () => window.removeEventListener(SESSION_ENDED_EVENT, listener);
}

async function requestRefresh() {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: CLIENT_HEADERS,
    });
    if (response.ok) {
      const { token } = await response.json();
      saveToken(token);
      return token;
    }
    if (response.status === 401 || response.status === 403) endSession();
    return null;
  } catch {
    return null; // server unreachable: don't sign anyone out over a network blip
  }
}

/**
 * Trades the refresh cookie for a new login token, or returns null. Refresh tokens
 * are single-use, so parallel callers must share one request.
 */
export function refreshSession() {
  refreshInFlight ??= requestRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/** A login token that's good to send right now, renewing it first if needed. */
export async function getToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  return isExpiring(token) ? refreshSession() : token;
}

/** Ends this sign-in on the server too, so its refresh token can't be used again. */
export async function revokeSession() {
  try {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: CLIENT_HEADERS,
    });
  } catch {
    // Signing out locally still has to work offline.
  }
  endSession();
}
