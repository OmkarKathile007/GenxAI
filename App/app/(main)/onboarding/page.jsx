"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialForm = {
  businessName: "",
  industry: "",
  website: "",
  location: "",
  timezone: "Asia/Kolkata",
  workingHours: "Monday to Friday, 10:00 AM - 6:00 PM",
  productsServices: "",
  targetAudience: "",
  salesGoal: "",
  commonFaqs: "",
  pricingInfo: "",
  preferredLanguage: "English",
  callTone: "Professional",
  agentName: "",
  agentVoice: "Indian female (English)",
  callObjective: "",
  qualificationQuestions: "",
  agentGuardrails: "",
};

const wizardSteps = [
  {
    title: "About your business",
    short: "Business",
    blurb: "The basics your agent needs to sound specific and credible.",
    icon: Building2,
  },
  {
    title: "Your sales goal",
    short: "Goal",
    blurb: "What a great call should achieve — and the facts to back it up.",
    icon: Target,
  },
  {
    title: "Meet your agent",
    short: "Agent",
    blurb: "Give it a name and a voice, then set how it qualifies leads.",
    icon: Sparkles,
  },
];

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [customVoiceId, setCustomVoiceId] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  };

  const handleSelectChange = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  // Only the first step blocks progress — keep friction low.
  const validateStep = () => {
    if (step === 0) {
      if (!formData.businessName.trim()) return "Add your business name to continue.";
      if (!formData.productsServices.trim()) return "Tell us what you offer so the agent knows what to say.";
    }
    return "";
  };

  const next = () => {
    const msg = validateStep();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, wizardSteps.length - 1));
  };

  const back = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const save = async () => {
    const msg = validateStep();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const payload = { ...formData };
      if (payload.agentVoice === "__custom__") {
        if (!customVoiceId.trim()) {
          setError("Enter your ElevenLabs voice ID, or pick a preset voice.");
          setStep(2);
          setIsSaving(false);
          return;
        }
        payload.agentVoice = `11labs:${customVoiceId.trim()}`;
      }
      await apiClient.put("/api/businesses/me/profile", payload);
      toast.success("Your workspace is ready 🎉");
      router.push("/dashboard");
    } catch (err) {
      const message = err.response?.data?.message || "Unable to save business profile";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const isLast = step === wizardSteps.length - 1;
  const progress = Math.round(((step + 1) / wizardSteps.length) * 100);

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Left rail */}
        <aside className="border-b border-white/10 bg-[#0f1115] px-6 py-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-12">
          <div className="max-w-md">
            <div className="mb-8 inline-flex items-center gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Voice Funnel setup
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Set up your agent in 3 quick steps.
            </h1>
            <p className="mt-4 text-base leading-7 text-zinc-400">
              Takes about 2 minutes. You can change anything later from your Business Profile.
            </p>

            <ol className="mt-10 space-y-3">
              {wizardSteps.map((s, i) => {
                const Icon = s.icon;
                const done = i < step;
                const active = i === step;
                return (
                  <li
                    key={s.title}
                    className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
                      active
                        ? "border-emerald-400/30 bg-emerald-400/[0.06]"
                        : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                        active || done
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                          : "border-white/10 bg-white/[0.04] text-zinc-500"
                      }`}
                    >
                      {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${active || done ? "text-white" : "text-zinc-400"}`}>
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-zinc-500">{s.blurb}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        {/* Right: current step */}
        <section className="px-6 py-8 lg:px-10 lg:py-12">
          <div className="mx-auto max-w-3xl">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm">
                <p className="font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Step {step + 1} of {wizardSteps.length}
                </p>
                <span className="nums text-zinc-500">{progress}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-white">{wizardSteps[step].title}</h2>
              <p className="mt-2 text-sm text-zinc-400">{wizardSteps[step].blurb}</p>
            </div>

            {/* STEP 1 — About your business */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Business name" required>
                    <Input name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Acme Growth Studio" className="h-11 border-white/10 bg-white/[0.04] text-white" />
                  </Field>
                  <Field label="Industry">
                    <Input name="industry" value={formData.industry} onChange={handleChange} placeholder="Real estate, EdTech, SaaS" className="h-11 border-white/10 bg-white/[0.04] text-white" />
                  </Field>
                  <Field label="Website">
                    <Input name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" className="h-11 border-white/10 bg-white/[0.04] text-white" />
                  </Field>
                  <Field label="Location">
                    <Input name="location" value={formData.location} onChange={handleChange} placeholder="Pune, India" className="h-11 border-white/10 bg-white/[0.04] text-white" />
                  </Field>
                </div>

                <Field label="What do you offer?" required>
                  <Textarea name="productsServices" value={formData.productsServices} onChange={handleChange} placeholder="Describe what you sell, your strongest offers, and what makes it valuable." className="min-h-28 border-white/10 bg-white/[0.04] text-white" />
                </Field>

                <Field label="Who are your customers?">
                  <Textarea name="targetAudience" value={formData.targetAudience} onChange={handleChange} placeholder="Example: founders, real estate buyers, coaching leads, clinic patients, SaaS trial users." className="min-h-24 border-white/10 bg-white/[0.04] text-white" />
                </Field>
              </div>
            )}

            {/* STEP 2 — Sales goal */}
            {step === 1 && (
              <div className="space-y-6">
                <Field label="What should a great call achieve?">
                  <Textarea name="salesGoal" value={formData.salesGoal} onChange={handleChange} placeholder="Example: qualify leads, book demos, invite users to a consultation, or collect product feedback." className="min-h-24 border-white/10 bg-white/[0.04] text-white" />
                </Field>

                <Field label="Call objective (one line)">
                  <Input name="callObjective" value={formData.callObjective} onChange={handleChange} placeholder="Qualify the lead and invite them to a free consultation." className="h-11 border-white/10 bg-white/[0.04] text-white" />
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Common FAQs">
                    <Textarea name="commonFaqs" value={formData.commonFaqs} onChange={handleChange} placeholder="Pricing, timelines, eligibility, refunds, location, support." className="min-h-28 border-white/10 bg-white/[0.04] text-white" />
                  </Field>
                  <Field label="Pricing notes">
                    <Textarea name="pricingInfo" value={formData.pricingInfo} onChange={handleChange} placeholder="Plans, starting price, trial, discounts, EMI, custom quote policy." className="min-h-28 border-white/10 bg-white/[0.04] text-white" />
                  </Field>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Preferred language">
                    <Select value={formData.preferredLanguage} onValueChange={(value) => handleSelectChange("preferredLanguage", value)}>
                      <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Hinglish">Hinglish</SelectItem>
                        <SelectItem value="Regional">Regional language</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Agent tone">
                    <Select value={formData.callTone} onValueChange={(value) => handleSelectChange("callTone", value)}>
                      <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Friendly">Friendly</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Consultative">Consultative</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 3 — Meet your agent */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Agent name">
                    <Input name="agentName" value={formData.agentName} onChange={handleChange} placeholder="Riya" className="h-11 border-white/10 bg-white/[0.04] text-white" />
                  </Field>

                  <Field label="Agent voice">
                    <Select value={formData.agentVoice} onValueChange={(value) => handleSelectChange("agentVoice", value)}>
                      <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectGroup>
                          <SelectLabel>Indian (Azure)</SelectLabel>
                          <SelectItem value="Indian female (English)">Indian female (English) — recommended</SelectItem>
                          <SelectItem value="Indian male (English)">Indian male (English)</SelectItem>
                          <SelectItem value="Hindi female">Hindi female</SelectItem>
                          <SelectItem value="Hindi male">Hindi male</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>ElevenLabs (premium)</SelectLabel>
                          <SelectItem value="ElevenLabs Aria">ElevenLabs — Aria (female)</SelectItem>
                          <SelectItem value="ElevenLabs Sarah">ElevenLabs — Sarah (female)</SelectItem>
                          <SelectItem value="ElevenLabs Rachel">ElevenLabs — Rachel (female)</SelectItem>
                          <SelectItem value="ElevenLabs Charlotte">ElevenLabs — Charlotte (female)</SelectItem>
                          <SelectItem value="ElevenLabs Matilda">ElevenLabs — Matilda (female)</SelectItem>
                          <SelectItem value="ElevenLabs Adam">ElevenLabs — Adam (male)</SelectItem>
                          <SelectItem value="ElevenLabs Brian">ElevenLabs — Brian (male)</SelectItem>
                          <SelectItem value="__custom__">ElevenLabs — custom voice ID…</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {formData.agentVoice === "__custom__" && (
                      <Input value={customVoiceId} onChange={(e) => setCustomVoiceId(e.target.value)} placeholder="Paste ElevenLabs voice ID (e.g. 21m00Tcm4TlvDq8ikWAM)" className="mt-2 h-11 border-white/10 bg-white/[0.04] text-white" />
                    )}
                    <p className="mt-1.5 text-xs text-zinc-500">
                      ElevenLabs needs ElevenLabs enabled on your Vapi account. Indian (Azure) works out of the box.
                    </p>
                  </Field>
                </div>

                <Field label="Qualification questions">
                  <Textarea name="qualificationQuestions" value={formData.qualificationQuestions} onChange={handleChange} placeholder={"What are you looking for?\nHow soon do you want to start?\nWhat's your budget range?"} className="min-h-28 border-white/10 bg-white/[0.04] text-white" />
                </Field>

                <Field label="Do / don't say (guardrails)">
                  <Textarea name="agentGuardrails" value={formData.agentGuardrails} onChange={handleChange} placeholder={"Never promise discounts.\nDon't quote exact prices — say a team member will confirm.\nAlways stay polite if the person is busy."} className="min-h-28 border-white/10 bg-white/[0.04] text-white" />
                </Field>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Nav */}
            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={back} disabled={isSaving} className="h-11 border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <button type="button" onClick={() => router.push("/dashboard")} className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">
                  I&apos;ll set this up later
                </button>
              )}

              {isLast ? (
                <Button type="button" onClick={save} disabled={isSaving} className="h-11 bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 font-medium text-black shadow-glow-emerald hover:opacity-90">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create workspace<Sparkles className="h-4 w-4" /></>}
                </Button>
              ) : (
                <Button type="button" onClick={next} className="h-11 bg-emerald-500 px-6 font-medium text-black hover:bg-emerald-400">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, required = false, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-1 text-emerald-300">*</span>}
      </Label>
      {children}
    </div>
  );
}
