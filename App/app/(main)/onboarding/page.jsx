"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Loader2, PhoneCall, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
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

const setupSteps = [
  {
    title: "Create business profile",
    description: "Your products, audience, FAQs, tone, and operating hours become the agent context.",
    icon: Building2,
  },
  {
    title: "Import targeted contacts",
    description: "Upload CSV leads, validate fields, deduplicate records, and segment by campaign source.",
    icon: UploadCloud,
  },
  {
    title: "Schedule AI voice calls",
    description: "Launch professional outreach, collect qualification data, and sync insights to dashboard.",
    icon: PhoneCall,
  },
];

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await apiClient.put("/api/businesses/me/profile", formData);
      toast.success("Business workspace created");
      router.push("/dashboard");
    } catch (err) {
      const message = err.response?.data?.message || "Unable to save business profile";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="border-b border-white/10 bg-[#0f1115] px-6 py-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-12">
          <div className="max-w-xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Voice Funnel setup
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Build your AI voice acquisition workspace.
            </h1>
            <p className="mt-5 text-base leading-7 text-zinc-400">
              Start with the business context. This profile will later drive CSV imports, campaign segmentation,
              professional call scripts, follow-ups, and sales analysis.
            </p>

            <div className="mt-10 space-y-5">
              {setupSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-emerald-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">{step.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="px-6 py-8 lg:px-10 lg:py-12">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">Step 1 of 4</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Business details</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Keep this accurate. The voice agent will use it to sound specific and credible.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Business name" required>
                <Input
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Acme Growth Studio"
                  required
                  className="h-11 border-white/10 bg-white/[0.04] text-white"
                />
              </Field>

              <Field label="Industry">
                <Input
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="Real estate, EdTech, SaaS"
                  className="h-11 border-white/10 bg-white/[0.04] text-white"
                />
              </Field>

              <Field label="Website">
                <Input
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="h-11 border-white/10 bg-white/[0.04] text-white"
                />
              </Field>

              <Field label="Location">
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Pune, India"
                  className="h-11 border-white/10 bg-white/[0.04] text-white"
                />
              </Field>

              <Field label="Timezone">
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => handleSelectChange("timezone", value)}
                >
                  <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Working hours">
                <Input
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleChange}
                  placeholder="Monday to Friday, 10 AM - 6 PM"
                  className="h-11 border-white/10 bg-white/[0.04] text-white"
                />
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Preferred language">
                <Select
                  value={formData.preferredLanguage}
                  onValueChange={(value) => handleSelectChange("preferredLanguage", value)}
                >
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

            <Field label="Products or services" required>
              <Textarea
                name="productsServices"
                value={formData.productsServices}
                onChange={handleChange}
                placeholder="Describe what you sell, your strongest offers, and what makes it valuable."
                required
                className="min-h-32 border-white/10 bg-white/[0.04] text-white"
              />
            </Field>

            <Field label="Target audience" required>
              <Textarea
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                placeholder="Example: founders, real estate buyers, coaching leads, clinic patients, SaaS trial users."
                required
                className="min-h-28 border-white/10 bg-white/[0.04] text-white"
              />
            </Field>

            <Field label="Sales goal" required>
              <Textarea
                name="salesGoal"
                value={formData.salesGoal}
                onChange={handleChange}
                placeholder="Example: qualify leads, book demos, invite users to platform consultation, or collect user research."
                required
                className="min-h-28 border-white/10 bg-white/[0.04] text-white"
              />
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Common FAQs">
                <Textarea
                  name="commonFaqs"
                  value={formData.commonFaqs}
                  onChange={handleChange}
                  placeholder="Pricing, timelines, eligibility, refunds, location, support."
                  className="min-h-32 border-white/10 bg-white/[0.04] text-white"
                />
              </Field>

              <Field label="Pricing notes">
                <Textarea
                  name="pricingInfo"
                  value={formData.pricingInfo}
                  onChange={handleChange}
                  placeholder="Plans, starting price, trial, discounts, EMI, custom quote policy."
                  className="min-h-32 border-white/10 bg-white/[0.04] text-white"
                />
              </Field>
            </div>

            <div className="border-t border-white/10 pt-8">
              <h3 className="text-lg font-semibold text-white">AI voice agent</h3>
              <p className="mt-1 text-sm text-zinc-400">
                How your agent introduces itself, which voice it uses, and how it qualifies each lead.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field label="Agent name">
                  <Input
                    name="agentName"
                    value={formData.agentName}
                    onChange={handleChange}
                    placeholder="Riya"
                    className="h-11 border-white/10 bg-white/[0.04] text-white"
                  />
                </Field>

                <Field label="Agent voice">
                  <Select
                    value={formData.agentVoice}
                    onValueChange={(value) => handleSelectChange("agentVoice", value)}
                  >
                    <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indian female (English)">Indian female (English)</SelectItem>
                      <SelectItem value="Indian male (English)">Indian male (English)</SelectItem>
                      <SelectItem value="Hindi female">Hindi female</SelectItem>
                      <SelectItem value="Hindi male">Hindi male</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Call objective">
                  <Input
                    name="callObjective"
                    value={formData.callObjective}
                    onChange={handleChange}
                    placeholder="Qualify the lead and invite them to a free consultation."
                    className="h-11 border-white/10 bg-white/[0.04] text-white"
                  />
                </Field>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field label="Qualification questions">
                  <Textarea
                    name="qualificationQuestions"
                    value={formData.qualificationQuestions}
                    onChange={handleChange}
                    placeholder={"What are you looking for?\nHow soon do you want to start?\nWhat's your budget range?"}
                    className="min-h-32 border-white/10 bg-white/[0.04] text-white"
                  />
                </Field>

                <Field label="Do / don't say (guardrails)">
                  <Textarea
                    name="agentGuardrails"
                    value={formData.agentGuardrails}
                    onChange={handleChange}
                    placeholder={"Never promise discounts.\nDon't quote exact prices — say a team member will confirm.\nAlways stay polite if the person is busy."}
                    className="min-h-32 border-white/10 bg-white/[0.04] text-white"
                  />
                </Field>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-500">
                Next: contacts CSV import, lead selection, and voice campaign scheduling.
              </p>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 bg-emerald-500 px-6 text-black hover:bg-emerald-400"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Workspace"}
              </Button>
            </div>
          </form>
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
