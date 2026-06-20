// "use client";

// import React from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation"; 
// import { useAuth } from "@/components/providers/AuthProvider"; 
// import { Button } from "@/components/ui/button";
// import { Command } from "lucide-react";

// function HeroSection() {
//   const router = useRouter();
//   const { isLoggedIn } = useAuth(); // Get login status

//   const handleGetStarted = () => {
//     if (isLoggedIn) {
//       router.push("/onboarding");
//     } else {
//       router.push("/login");
//     }
//   };

//   return (
//     <section className="relative w-full pt-32 pb-32 md:pt-48 md:pb-32 overflow-hidden bg-black selection:bg-blue-500/30">
      
//       {/* PROFESSIONAL BACKGROUND GRID WITH FADE MASK */}
//       <div className="absolute inset-0 h-full w-full bg-black bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
//       {/* AMBIENT GLOWS */}
//       <div className="absolute top-0 left-0 right-0 h-[500px] w-full bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      
//       <div className="container relative z-10 px-4 md:px-6 mx-auto text-center flex flex-col items-center">
        
//         {/* BADGE */}
//         <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-md mb-8 ring-1 ring-white/5 shadow-lg shadow-blue-500/10">
//           <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
//           <span className="text-xs font-medium text-zinc-300 tracking-wide uppercase">
//             Voice Funnel Workspace
//           </span>
//         </div>

//         {/* HEADLINE */}
//         <div className="space-y-6 max-w-4xl mx-auto mb-8">
//           <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-white drop-shadow-sm">
//             AI Voice Calls. <br />
//             <span className="bg-clip-text text-transparent bg-gradient-to-b from-blue-300 via-blue-500 to-purple-600">
//               Qualified Leads.
//             </span>
//           </h1>
          
//           <p className="mx-auto max-w-2xl text-zinc-400 text-lg md:text-xl leading-relaxed">
//             Build a professional AI calling system that imports targeted contacts, schedules outreach, qualifies leads, and turns every conversation into sales intelligence.
//           </p>
//         </div>

       
//         <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          
         
//           <Button 
//             size="lg" 
//             onClick={handleGetStarted}
//             className="h-12 px-8 rounded-full bg-white text-black hover:bg-zinc-200 font-semibold text-base shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
//           >
//             Create Workspace
//           </Button>
          
//           <Link href="#features">
//             <Button variant="outline" size="lg" className="h-12 px-8 rounded-full border-zinc-800 bg-zinc-900/50 text-white hover:bg-zinc-900 hover:border-zinc-700 transition-all backdrop-blur-sm">
//               <Command className="w-4 h-4 mr-2 text-zinc-500" />
//               View Workflow
//             </Button>
//           </Link>
          
//         </div>

//         {/* SOCIAL PROOF */}
//         <div className="mt-20 pt-10 border-t border-white/5 w-full max-w-4xl opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
//            <p className="text-xs text-zinc-500 mb-6 uppercase tracking-widest font-semibold">Designed for targeted sales and marketing teams</p>
//            <div className="flex justify-center gap-10 opacity-50">
//                 <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse" />
//                 <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse delay-75" />
//                 <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse delay-150" />
//                 <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse delay-200" />
//            </div>
//         </div>

//       </div>
//     </section>
//   );
// }

// export default HeroSection;
"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Sparkles,
  Play,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Users,
  Filter,
  BarChart3,
  AudioLines,
} from "lucide-react";

function HeroSection() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push("/onboarding");
    } else {
      router.push("/login");
    }
  };

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
    { label: "Pricing", href: "#pricing" },
  ];

  const features = [
    {
      icon: Users,
      title: "Import Contacts",
      desc: "Upload targeted lists and organize your outreach campaigns.",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      icon: Phone,
      title: "AI Voice Calls",
      desc: "Natural-sounding AI agents call prospects and handle conversations.",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Filter,
      title: "Qualify Leads",
      desc: "AI qualifies leads based on your criteria and captures key information.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: BarChart3,
      title: "Sales Intelligence",
      desc: "Get actionable insights and analytics to close more deals.",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  const logos = [
    "Acme Co",
    "Globex",
    "Initech",
    "Stark Industries",
    "Umbrella Corp",
    "Wayne Enterprises",
  ];

  // Varied bar heights for a realistic call waveform
  const waveBars = [
    8, 14, 22, 12, 28, 18, 34, 16, 26, 20, 38, 14, 30, 22, 36, 12, 24, 18, 40,
    16, 28, 14, 34, 20, 26, 12, 30, 18, 36, 22, 14, 28, 16, 32, 20, 24,
  ];

  return (
    <section className="relative w-full overflow-hidden bg-[#0a0a14] selection:bg-blue-500/30">
      {/* BACKGROUND GRID (very subtle) + FADE MASK */}
      <div className="pointer-events-none absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_70%_at_70%_10%,#000_50%,transparent_100%)]" />

      {/* DIRECTIONAL GLOW behind the dashboard (top-right) */}
      <div className="pointer-events-none absolute -top-32 right-[5%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12)_0%,rgba(147,51,234,0.06)_40%,transparent_70%)] blur-[60px]" />
      {/* Secondary purple glow lower-left of panel */}
      <div className="pointer-events-none absolute top-40 left-[10%] h-[500px] w-[500px] rounded-full bg-purple-600/[0.07] blur-[130px]" />

      {/* FLOWING WAVE LINES (lower-right, rippling up toward dashboard) */}
      <svg
        className="pointer-events-none absolute bottom-0 right-0 h-[600px] w-1/2 opacity-60"
        viewBox="0 0 700 600"
        fill="none"
        preserveAspectRatio="xMaxYMax slice"
      >
        <defs>
          <linearGradient id="waveStroke" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="45%" stopColor="#6366f1" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {[0, 32, 64, 96, 128].map((offset, i) => (
          <path
            key={i}
            d={`M ${-50} ${560 + i * 8}
                C ${180 + offset} ${500 - offset * 0.3}, ${380 + offset} ${440 - offset * 0.5}, ${760} ${200 - offset * 1.1}`}
            stroke="url(#waveStroke)"
            strokeWidth="1.5"
            fill="none"
          />
        ))}
      </svg>

      {/* DOT MATRIX (between headline and dashboard) */}
      <svg
        className="pointer-events-none absolute left-[44%] top-[44%] hidden h-[160px] w-[140px] opacity-60 lg:block"
        viewBox="0 0 140 160"
        fill="none"
      >
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 6 }).map((_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={8 + col * 24}
              cy={8 + row * 22}
              r="1.6"
              fill="#6366f1"
              opacity={0.25 + ((row + col) % 4) * 0.12}
            />
          ))
        )}
      </svg>

      {/* ================= NAVBAR ================= */}
      <header className="relative z-20 mx-auto max-w-7xl px-4 md:px-6 pt-6">
        <nav className="flex items-center justify-between rounded-full border border-white/[0.06] bg-white/[0.02] px-5 py-3 backdrop-blur-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <AudioLines className="h-6 w-6 text-blue-500" />
            <span className="text-lg font-bold tracking-tight text-white">
              GenxAI
            </span>
          </Link>

          {/* Center links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="h-9 rounded-full px-4 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                Sign In
              </Button>
            </Link>
            <Button
              onClick={handleGetStarted}
              className="h-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-transform hover:scale-[1.02]"
            >
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* ================= HERO BODY ================= */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 pt-20 pb-16 md:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* LEFT: Copy */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 backdrop-blur-md">
              {/* <Sparkles className="h-3.5 w-3.5 text-purple-400" /> */}
              {/* <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                AI Voice Funnel Workspace
              </span> */}
            </div>

            {/* Headline */}
            <h1 className="text-5xl font-bold leading-[0.95] tracking-tighter text-white md:text-7xl">
              AI Voice Calls. <br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Qualified Leads.
              </span>
            </h1>

            {/* Subhead */}
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400 lg:mx-0">
              AI calling system that imports targeted 
              contacts from your CRM, schedules outreach, qualifies leads, and turns every
              conversation into sales intelligence.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="group h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-7 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-transform hover:scale-[1.02]"
              >
                Create Workspace
                <svg
                  className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>

              <Link href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-full border-white/10 bg-white/[0.03] px-7 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/[0.06]"
                >
                  See How It Works
                  <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/20">
                    <Play className="h-3 w-3 fill-current" />
                  </span>
                </Button>
              </Link>
            </div>

            {/* Trust row */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start">
              <span className="flex items-center gap-2 text-sm text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                No Credit Card
              </span>
              <span className="flex items-center gap-2 text-sm text-zinc-400">
                <Zap className="h-4 w-4 text-yellow-400" />
                Setup in Minutes
              </span>
              <span className="flex items-center gap-2 text-sm text-zinc-400">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                Secure &amp; Compliant
              </span>
            </div>
          </div>

          {/* RIGHT: Dashboard mockup */}
          <div className="relative">
            {/* Floating phone icon (glowing circle, outside panel) */}
            <div className="absolute -right-4 top-8 z-30 hidden h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#141828]/80 shadow-[0_0_40px_rgba(56,189,248,0.4),inset_0_0_20px_rgba(56,189,248,0.1)] backdrop-blur-md lg:flex">
              <Phone className="h-6 w-6 text-sky-400" />
            </div>
            {/* Floating sparkle icon (glowing circle) */}
            <div className="absolute -right-1 top-44 z-30 hidden h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#141828]/80 shadow-[0_0_30px_rgba(147,51,234,0.35)] backdrop-blur-md lg:flex">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>

            {/* Main dashboard panel with cyan rim-light */}
            <div className="relative rounded-3xl p-[1px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
              {/* Rim-light gradient border (bright top-right, fading) */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(215deg,rgba(56,189,248,0.7)_0%,rgba(56,189,248,0)_35%,rgba(255,255,255,0.04)_100%)]" />

              <div className="relative rounded-3xl bg-gradient-to-br from-[#1e2030]/70 to-[#10121e]/80 p-5 backdrop-blur-xl">
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Live Calls */}
                  <StatCard dot label="Live Calls" value="128" delta="24%" />
                  {/* Qualified Leads */}
                  <StatCard label="Qualified Leads" value="42" delta="16%" />
                  {/* Conversion Rate (with caret) */}
                  <StatCard label="Conversion Rate" value="32%" delta="8%" caret />

                  {/* Chart card with glowing area fill */}
                  <div className="relative flex items-end overflow-hidden rounded-xl border border-white/[0.05] bg-[#0d0f19]/60 p-3">
                    <svg
                      viewBox="0 0 200 90"
                      className="h-full w-full"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* area fill */}
                      <path
                        d="M0,70 C30,66 45,55 70,50 C95,45 105,30 130,26 C155,22 175,12 200,8 L200,90 L0,90 Z"
                        fill="url(#chartFill)"
                      />
                      {/* line */}
                      <path
                        d="M0,70 C30,66 45,55 70,50 C95,45 105,30 130,26 C155,22 175,12 200,8"
                        fill="none"
                        stroke="url(#chartLine)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {/* glowing peak dot */}
                      <circle cx="130" cy="26" r="8" fill="#a855f7" opacity="0.25" />
                      <circle cx="130" cy="26" r="4" fill="#a855f7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Call in Progress card (overlapping bottom-right) */}
            <div className="absolute -bottom-12 right-2 z-30 w-[80%] rounded-2xl border border-white/[0.08] bg-[#0d0f19]/95 p-4 backdrop-blur-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]">
              <div className="mb-3.5 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">
                  AI Call in Progress
                </span>
                <span className="text-xs text-zinc-500">00:24</span>
              </div>

              {/* Waveform (dense, varied heights) */}
              <div className="flex h-10 items-center justify-center gap-[2px]">
                {waveBars.map((h, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-gradient-to-t from-blue-500 to-purple-500"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>

              <div className="mt-3.5 flex items-end justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Speaking with</p>
                  <p className="text-sm font-semibold text-white">
                    Sarah Johnson
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                  Qualified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= FEATURE CARDS ================= */}
        <div
          id="features"
          className="mt-28 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-[#0a0a14] p-6 transition-colors hover:bg-white/[0.02]"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}
                >
                  <Icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* ================= LOGO STRIP ================= */}
        {/* <div className="mt-20 text-center">
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Trusted by Sales &amp; Marketing Teams Worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {logos.map((name) => (
              <span
                key={name}
                className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {name}
              </span>
            ))}
          </div>
        </div> */}
      </div>
    </section>
  );
}

/* ---- Small stat card subcomponent ---- */
function StatCard({ label, value, delta, dot, caret }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-[#0d0f19]/60 p-4">
      <div className="mb-2 flex items-center gap-1.5">
        {dot && (
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
        )}
        {caret && <span className="text-xs text-zinc-500">›</span>}
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
          ↑ {delta}
        </span>
      </div>
    </div>
  );
}

export default HeroSection;