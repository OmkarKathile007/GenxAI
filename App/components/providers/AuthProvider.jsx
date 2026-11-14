"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, onSessionEnded, revokeSession, saveToken } from "@/lib/session";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Hydrate auth state once on app start, renewing an expired token first. If it
    // can't be renewed the user is logged out, so Sign In reaches the login page.
    const stopListening = onSessionEnded(() => setToken(null));
    getToken()
      .then(setToken)
      .finally(() => setLoading(false));
    return stopListening;
  }, []);

  /**
   * Persist the token and navigate to the post-auth destination.
   * Callers pass only the token; the single redirect happens here so pages
   * never double-navigate.
   */
  const login = (newToken, redirectTo = "/onboarding") => {
    saveToken(newToken);
    setToken(newToken);
    router.replace(redirectTo);
  };

  const logout = async () => {
    await revokeSession();
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ token, isLoggedIn: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
