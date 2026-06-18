"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import GoogleSignInButton from "@/components/features/auth/GoogleSignInButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { loginRequest, googleAuthRequest, authErrorMessage, isValidEmail } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = formData.username.trim();

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!formData.password) {
      setError("Enter your password.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const data = await loginRequest(email, formData.password);
      if (data?.token) {
        login(data.token); // single redirect handled by AuthProvider
      } else {
        setError("Unexpected response from the server. Please try again.");
      }
    } catch (err) {
      setError(authErrorMessage(err, "Login failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credential) => {
    setIsGoogleLoading(true);
    setError("");
    try {
      const data = await googleAuthRequest(credential);
      if (data?.token) login(data.token);
    } catch (err) {
      setError(authErrorMessage(err, "Google sign-in failed. Please try again."));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const busy = isLoading || isGoogleLoading;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0a0a0a] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400">Sign in to your GenXAI workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium text-gray-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                id="login-email"
                type="email"
                name="username"
                autoComplete="email"
                required
                placeholder="name@example.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-10 py-2.5 text-white transition-all placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={formData.username}
                onChange={handleChange}
                disabled={busy}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-sm font-medium text-gray-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => toast.info("Password reset is coming soon. Contact support for help.")}
                className="text-xs text-emerald-400 transition-colors hover:text-emerald-300"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-10 py-2.5 text-white transition-all placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={formData.password}
                onChange={handleChange}
                disabled={busy}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-3 text-gray-500 transition-colors hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 font-semibold text-black shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:from-emerald-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign in <ArrowRight className="h-5 w-5" />
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
              <GoogleSignInButton onCredential={handleGoogleLogin} disabled={isLoading} />
            )}
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-white transition-colors hover:text-emerald-400">
            Sign up for free
          </Link>
        </div>
      </div>
    </div>
  );
}
