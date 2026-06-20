import { Button } from "@/components/ui/button";
import HeroSection from "@/components/shared/Hero";
import { features } from "@/data/features";
import { howItWorks } from "@/data/howItWorks";
import { testimonial } from "@/data/testimonial";
import { faqs } from "@/data/faqs";
import Link from "next/link";
import Headersection from "@/components/shared/Header";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-slate-200 selection:bg-blue-500/30 font-sans">
      {/* <Headersection /> */}
      <HeroSection />

      {/* --- FEATURES SECTION (Bento Grid Style) --- */}
      <section id="features" className="w-full py-24 bg-black relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              Turn phone conversations into revenue data
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Import targeted contacts, launch AI calling campaigns, and analyze every lead conversation from one workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group relative p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- STATS SECTION (Minimalist Strip) --- */}
      <section className="w-full border-y border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
            {[
              { label: "Voice Campaigns", value: "24/7" },
              { label: "Lead Fields", value: "15+" },
              { label: "Call Signals", value: "10+" },
              { label: "Workspace", value: "B2B" },
            ].map((stat, i) => (
              <div key={i} className="pl-4 first:pl-0">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Timeline Style) --- */}
      <section id="how-it-works" className="w-full py-24 bg-black">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How it works</h2>
            <p className="text-gray-400 text-lg">A structured workflow for targeted sales and marketing teams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-900 to-transparent z-0"></div>

            {howItWorks.map((item, index) => (
              <div key={index} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-black border-4 border-blue-900/50 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <div className="text-blue-400 scale-125">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS (Dark Cards) --- */}
      <section id='testimonials' className="w-full py-24 bg-gradient-to-b from-zinc-900 to-black">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
            Built for sales and marketing operators
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {testimonial.map((item, index) => (
              <div key={index} className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"></div>
                  <div>
                    <p className="font-bold text-white">{item.author}</p>
                    <p className="text-xs text-gray-400">{item.role} @ {item.company}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{item.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section id="faq" className="w-full py-24 bg-black">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-white/10 rounded-lg bg-white/[0.02] px-4">
                <AccordionTrigger className="text-white hover:no-underline hover:text-blue-400 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="w-full py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        
        <div className="container relative z-10 mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            Ready to build your voice funnel?
          </h2>
          <p className="text-xl text-blue-100/80 mb-10">
            Create a business workspace, prepare your target contacts, and start building AI-powered acquisition.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="h-14 px-10 rounded-full bg-white text-blue-900 hover:bg-gray-100 font-bold text-lg shadow-xl shadow-blue-900/20">
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/10 bg-black py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>&copy; 2026 GenXAI. All rights reserved.</p>
          <div className="flex items-center gap-1 mt-4 md:mt-0">
            <span>Made with</span>
            <span className="text-red-500">♥</span>
            <span>by Omkar</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
