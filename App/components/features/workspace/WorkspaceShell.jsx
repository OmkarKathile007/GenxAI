"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarClock,
  ContactRound,
  FileSpreadsheet,
  LogOut,
  Megaphone,
  MessageSquareText,
  PhoneCall,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuroraBackground } from "./ui";

// Grouped so the sidebar reads like a product, not a flat link dump.
const navGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/dashboard", icon: BarChart3 },
      { label: "Business Profile", href: "/business-profile", icon: Building2 },
    ],
  },
  {
    label: "Audience",
    items: [
      { label: "Contacts", href: "/contacts", icon: ContactRound },
      { label: "CSV Imports", href: "/imports", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Outreach",
    items: [
      { label: "Campaigns", href: "/campaigns", icon: Megaphone },
      { label: "Call Schedule", href: "/call-schedule", icon: CalendarClock },
      { label: "Call Logs", href: "/call-logs", icon: PhoneCall },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Lead Insights", href: "/lead-insights", icon: Sparkles },
      { label: "Follow-ups", href: "/follow-ups", icon: MessageSquareText },
    ],
  },
];

export default function WorkspaceShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="relative min-h-screen text-white">
      <AuroraBackground />

      <div className="relative z-10 min-h-screen">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/[0.06] bg-[#0a0b0f]/70 backdrop-blur-2xl lg:block">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-5">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-black shadow-glow-emerald">
                <PhoneCall className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0b0f] bg-emerald-400" />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight text-white">GenXAI Voice Funnel</p>
                <p className="text-[11px] text-zinc-500">Customer acquisition OS</p>
              </div>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-white/[0.06] text-white"
                              : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                          )}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-emerald-400 to-cyan-400 shadow-glow-emerald" />
                          )}
                          <Icon
                            className={cn(
                              "h-[18px] w-[18px] transition-colors",
                              active ? "text-emerald-300" : "text-zinc-500 group-hover:text-zinc-300"
                            )}
                          />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-white/[0.06] p-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start rounded-xl text-zinc-400 hover:bg-white/[0.05] hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="lg:pl-72">
          <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#07080b]/70 px-4 py-4 backdrop-blur-2xl md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1 text-xs font-medium text-emerald-300 sm:inline-flex">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Voice workspace live
                </span>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Voice-powered sales workspace
                  </p>
                  <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-white">
                    Business Command Center
                  </h1>
                </div>
              </div>
              <Button
                type="button"
                className="group relative hidden h-10 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 font-medium text-black shadow-glow-emerald transition-transform hover:scale-[1.02] sm:inline-flex"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-white/30 [mask-image:linear-gradient(90deg,transparent,white,transparent)] group-hover:animate-sheen" />
                <PhoneCall className="h-4 w-4" />
                New Voice Campaign
              </Button>
            </div>
          </header>

          <main className="px-4 py-7 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
