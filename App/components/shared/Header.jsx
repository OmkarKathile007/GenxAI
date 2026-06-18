"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider"; // Import the custom hook
import { 
  Menu, 
  ChevronRight,
  User,
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  // Use global state instead of local state
  const { isLoggedIn, logout } = useAuth();

  // Define the navigation links
  const navItems = [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20 transition-all duration-300">
      <nav className="container mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* --- LOGO SECTION --- */}
        <Link 
          href="/" 
          className="flex items-center gap-3 group"
        >
          <span className="text-3xl font-semibold text-white tracking-tight hover:opacity-90 transition-opacity">
            GenxAI 
          </span>
        </Link>

        {/* --- CENTER NAV (Desktop) --- */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
                <Link 
                  key={item.label} 
                  href={item.href} 
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors relative group"
                >
                    {item.label}
                    {/* Hover Underline Effect */}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
            ))}
        </div>

        {/* --- ACTIONS SECTION --- */}
        <div className="flex items-center gap-3">
          
          {isLoggedIn ? (
            /* ====================
               LOGGED IN STATE
               ==================== */
            <div className="hidden md:flex items-center gap-3">
               
               {/* 1. Dashboard/User Icon */}
               <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-zinc-400 hover:text-white hover:bg-white/5 transition-all rounded-full"
                  title="Dashboard"
                >
                  <User className="w-5 h-5" />
                </Button>
              </Link>

              {/* 2. Logout Button */}
              <Button 
                variant="ghost" 
                onClick={logout}
                className="text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-all text-sm font-medium flex items-center gap-2"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>

              {/* 3. Enter Hub Button (Visible ONLY when logged in) */}
              <Link href="/dashboard">
                <Button 
                  className="group relative px-6 bg-white text-black hover:bg-zinc-200 border border-transparent font-semibold transition-all duration-300 overflow-hidden rounded-full md:rounded-md"
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-1000" />
                  
                  <span className="relative flex items-center gap-2">
                    Dashboard <ChevronRight className="w-3 h-3 text-black/60" />
                  </span>
                </Button>
              </Link>
            </div>
          ) : (
             /* ====================
               LOGGED OUT STATE
               ==================== */
            <Link href="/login" className="hidden md:block">
              <Button 
                variant="ghost" 
                className="text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
              >
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu Toggle (Visible on small screens) */}
          <Button variant="ghost" size="icon" className="md:hidden text-zinc-400 hover:text-white hover:bg-white/5">
            <Menu className="w-5 h-5" />
          </Button>

        </div>
      </nav>
    </header>
  );
};

export default Header;
