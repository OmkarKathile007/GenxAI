"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { useAuth } from "@/components/providers/AuthProvider"; 
import { Button } from "@/components/ui/button";
import { Command } from "lucide-react";

function HeroSection() {
  const router = useRouter();
  const { isLoggedIn } = useAuth(); // Get login status

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push("/onboarding");
    } else {
      router.push("/login");
    }
  };

  return (
    <section className="relative w-full pt-32 pb-32 md:pt-48 md:pb-32 overflow-hidden bg-black selection:bg-blue-500/30">
      
      {/* PROFESSIONAL BACKGROUND GRID WITH FADE MASK */}
      <div className="absolute inset-0 h-full w-full bg-black bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      {/* AMBIENT GLOWS */}
      <div className="absolute top-0 left-0 right-0 h-[500px] w-full bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container relative z-10 px-4 md:px-6 mx-auto text-center flex flex-col items-center">
        
        {/* BADGE */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-md mb-8 ring-1 ring-white/5 shadow-lg shadow-blue-500/10">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-xs font-medium text-zinc-300 tracking-wide uppercase">
            Voice Funnel Workspace
          </span>
        </div>

        {/* HEADLINE */}
        <div className="space-y-6 max-w-4xl mx-auto mb-8">
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-white drop-shadow-sm">
            AI Voice Calls. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-blue-300 via-blue-500 to-purple-600">
              Qualified Leads.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-zinc-400 text-lg md:text-xl leading-relaxed">
            Build a professional AI calling system that imports targeted contacts, schedules outreach, qualifies leads, and turns every conversation into sales intelligence.
          </p>
        </div>

       
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          
         
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="h-12 px-8 rounded-full bg-white text-black hover:bg-zinc-200 font-semibold text-base shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Workspace
          </Button>
          
          <Link href="#features">
            <Button variant="outline" size="lg" className="h-12 px-8 rounded-full border-zinc-800 bg-zinc-900/50 text-white hover:bg-zinc-900 hover:border-zinc-700 transition-all backdrop-blur-sm">
              <Command className="w-4 h-4 mr-2 text-zinc-500" />
              View Workflow
            </Button>
          </Link>
          
        </div>

        {/* SOCIAL PROOF */}
        <div className="mt-20 pt-10 border-t border-white/5 w-full max-w-4xl opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
           <p className="text-xs text-zinc-500 mb-6 uppercase tracking-widest font-semibold">Designed for targeted sales and marketing teams</p>
           <div className="flex justify-center gap-10 opacity-50">
                <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse" />
                <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse delay-75" />
                <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse delay-150" />
                <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse delay-200" />
           </div>
        </div>

      </div>
    </section>
  );
}

export default HeroSection;
