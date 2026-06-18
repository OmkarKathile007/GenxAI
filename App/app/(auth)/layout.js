"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AuthLayout({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Already signed in? Don't show the auth screens.
    if (!loading && isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [loading, isLoggedIn, router]);

  if (loading || isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return <div className="flex justify-center">{children}</div>;
}
