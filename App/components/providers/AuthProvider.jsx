"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Hydrate auth state from storage once on app start.
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  /**
   * Persist the token and navigate to the post-auth destination.
   * Callers pass only the token; the single redirect happens here so pages
   * never double-navigate.
   */
  const login = (newToken, redirectTo = "/onboarding") => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    router.replace(redirectTo);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ token, isLoggedIn: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
