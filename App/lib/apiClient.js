
 // Central API client that handles rate limit (429) responses globally.
 
import axios from "axios";
import { endSession, getToken, refreshSession } from "@/lib/session";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // lets the browser store the refresh cookie on sign-in
});

// Attach JWT token to every request automatically
apiClient.interceptors.request.use(async (config) => {
  // Sign-in requests don't need a login token, and are how you recover from lacking one.
  const token = config.url?.startsWith("/auth/") ? null : await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor: catch 429 before it reaches your components
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // The server refused our token. Renew it and retry once; if that fails the login
    // is over and ProtectedRoute sends the user to /login. Requests sent with no
    // token (public pages) aren't affected.
    const request = error.config;
    if (error.response?.status === 401 && request?.headers?.Authorization) {
      if (!request.retriedAfterRefresh) {
        request.retriedAfterRefresh = true;
        const token = await refreshSession();
        if (token) {
          request.headers.Authorization = `Bearer ${token}`;
          return apiClient(request);
        }
      } else {
        endSession();
      }
    }
    if (error.response?.status === 429) {
      const data = error.response.data;
      const minutes = data.retryAfterMinutes || "a few";
      error.rateLimitMessage = `Daily AI limit reached. Try again in ${minutes} minutes.`;
      error.isRateLimit = true;
    }
    return Promise.reject(error);
  }
);

export default apiClient;