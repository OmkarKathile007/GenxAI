"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

import GoogleSignInButton from "@/components/features/auth/GoogleSignInButton";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  registerRequest,
  googleAuthRequest,
  authErrorMessage,
  isValidEmail,
  isValidPassword,
  PASSWORD_MIN,
} from "@/lib/auth";

export default function SignupPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const validate = () => {
    if (!formData.fullName.trim()) return "Enter your full name.";
    if (!isValidEmail(formData.email)) return "Enter a valid email address.";
    if (!isValidPassword(formData.password))
      return `Password must be at least ${PASSWORD_MIN} characters.`;
    if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const email = formData.email.trim();
      const data = await registerRequest({
        username: email, // backend uses email as the username
        email,
        password: formData.password,
        fullName: formData.fullName.trim(),
      });
      if (data?.token) {
        login(data.token); // single redirect handled by AuthProvider
      } else {
        setError("Unexpected response from the server. Please try again.");
      }
    } catch (err) {
      setError(authErrorMessage(err, "Sign-up failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async (credential) => {
    setIsGoogleLoading(true);
    setError("");
    try {
      const data = await googleAuthRequest(credential);
      if (data?.token) login(data.token);
    } catch (err) {
      setError(authErrorMessage(err, "Google sign-up failed. Please try again."));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const busy = isLoading || isGoogleLoading;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0a0a0a] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400">Start turning calls into customers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label htmlFor="signup-name" className="text-sm font-medium text-gray-300">
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                id="signup-name"
                type="text"
                name="fullName"
                autoComplete="name"
                required
                placeholder="John Doe"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-10 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={formData.fullName}
                onChange={handleChange}
                disabled={busy}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-email" className="text-sm font-medium text-gray-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                id="signup-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-10 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={formData.email}
                onChange={handleChange}
                disabled={busy}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-password" className="text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                required
                placeholder={`At least ${PASSWORD_MIN} characters`}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-10 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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

          <div className="space-y-2">
            <label htmlFor="signup-confirm" className="text-sm font-medium text-gray-300">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                id="signup-confirm"
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                required
                placeholder="Re-enter your password"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-10 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={busy}
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 font-semibold text-black shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Create account <ArrowRight className="h-5 w-5" />
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
            <GoogleSignInButton onCredential={handleGoogleSignup} disabled={isLoading} />
          )}
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-400 transition-colors hover:text-emerald-300">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
