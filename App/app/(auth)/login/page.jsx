

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, ArrowRight, Loader2 } from "lucide-react"; 
import GoogleSignInButton from "@/components/features/auth/GoogleSignInButton";
import { useAuth } from "@/components/providers/AuthProvider"; 

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth(); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false); 
  const [formData, setFormData] = useState({
    username: "", 
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Standard Login Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await performLogin(formData.username, formData.password);
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message === "Bad credentials" ? "Invalid username or password" : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credential) => {
    setIsGoogleLoading(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        throw new Error(data.message || "Google login failed");
      }

      if (data.token) {
        login(data.token);
        router.push("/onboarding");
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      setError(err.message || "Google login failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Guest Login Handler
  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    setError("");

    try {
     

      //  A hardcoded guest account 
       const response = await fetch(`${BACKEND_URL}/auth/login`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "guest_user", password: "guest_password_123" }),
      });
      

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        throw new Error(data.message || "Guest login failed");
      }

      if (data.token) {
        login(data.token); 
        router.push("/onboarding"); 
      }

    } catch (err) {
      console.error("Guest Login Error:", err);
      setError("Unable to sign in as guest. Please try again.");
    } finally {
      setIsGuestLoading(false);
    }
  };

  // Reusable login logic 
  const performLogin = async (username, password) => {
    const payload = { username, password };
    const response = await fetch(`${BACKEND_URL}/auth/login`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      throw new Error(data.message || "Invalid username or password");
    }

    if (data.token) {
      login(data.token); 
      router.push("/onboarding"); 
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] flex items-center justify-center p-4 ">
      
       <div className="relative w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to continue your AI journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Username / Email</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                type="text"
                name="username"
                required
                placeholder="Enter your username"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-300">Password</label>
             { /* Link href should be /forgot-password, but we can change it later when we have that page*/}
              <Link href="/signup" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={isLoading || isGuestLoading || isGoogleLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-500">
              <div className="h-px flex-1 bg-white/10" />
              or
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {isGoogleLoading ? (
              <div className="flex min-h-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <GoogleSignInButton
                onCredential={handleGoogleLogin}
                disabled={isLoading || isGuestLoading}
              />
            )}

            {/* Guest Login Button */}
            {/* <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading || isGuestLoading}
              className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isGuestLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <UserCircle className="h-5 w-5" />
                  Continue as Guest
                </>
              )}
            </button> */}
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link href="/signup" className="text-white hover:text-blue-400 font-medium transition-colors">
            Sign up for free
          </Link>
        </div>
      </div>
    </div>
  );
}
