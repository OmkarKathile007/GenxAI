"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Check, ExternalLink, Loader2, Pencil, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import apiClient from "@/lib/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const profileFields = [
  ["Industry", "industry"],
  ["Website", "website"],
  ["Location", "location"],
  ["Timezone", "timezone"],
  ["Working hours", "workingHours"],
  ["Preferred language", "preferredLanguage"],
  ["Agent name", "agentName"],
  ["Agent voice", "agentVoice"],
  ["Agent tone", "callTone"],
];

const knowledgeFields = [
  ["Products or services", "productsServices"],
  ["Target audience", "targetAudience"],
  ["Sales goal", "salesGoal"],
  ["Call objective", "callObjective"],
  ["Qualification questions", "qualificationQuestions"],
  ["Do / don't say", "agentGuardrails"],
  ["Common FAQs", "commonFaqs"],
  ["Pricing notes", "pricingInfo"],
];

export default function BusinessProfilePage() {
  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playbook, setPlaybook] = useState("");
  const [generating, setGenerating] = useState(false);
  const [savingPlaybook, setSavingPlaybook] = useState(false);
  const [playbookSaved, setPlaybookSaved] = useState(false);

  const generatePlaybook = async () => {
    setGenerating(true);
    try {
      const res = await apiClient.post("/api/businesses/me/objection-playbook");
      setBusiness(res.data);
      setPlaybook(res.data?.objectionPlaybook || "");
      toast.success("Objection playbook generated — your agent will use it on the next call.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't generate the playbook.");
    } finally {
      setGenerating(false);
    }
  };

  const savePlaybook = async () => {
    setSavingPlaybook(true);
    try {
      const res = await apiClient.put("/api/businesses/me/profile", {
        ...business,
        objectionPlaybook: playbook,
      });
      setBusiness(res.data);
      setPlaybookSaved(true);
      setTimeout(() => setPlaybookSaved(false), 1500);
    } catch (e) {
      toast.error("Couldn't save the playbook.");
    } finally {
      setSavingPlaybook(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiClient.get("/api/businesses/me/profile");
        if (response.status === 200) {
          setBusiness(response.data);
          setPlaybook(response.data?.objectionPlaybook || "");
        }
      } catch (error) {
        console.error("Unable to load business profile", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center glass">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="glass p-6">
        <h2 className="text-xl font-semibold text-white">No business profile found</h2>
        <p className="mt-2 text-sm text-zinc-400">Create your profile before importing contacts or scheduling calls.</p>
        <Button asChild className="mt-5 bg-emerald-400 text-black hover:bg-emerald-300">
          <Link href="/onboarding">Create Business Profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/10">
                Workspace configured
              </Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{business.businessName}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                This profile is the base knowledge used for voice campaigns, lead qualification, objection handling,
                and follow-up generation.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]">
            <Link href="/onboarding">
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass">
          <div className="border-b border-white/10 p-5">
            <h3 className="text-base font-semibold text-white">Business details</h3>
          </div>
          <div className="divide-y divide-white/10">
            {profileFields.map(([label, key]) => (
              <div key={key} className="grid gap-2 p-5 text-sm sm:grid-cols-[160px_1fr]">
                <span className="text-zinc-500">{label}</span>
                <ProfileValue value={business[key]} isWebsite={key === "website"} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass">
          <div className="border-b border-white/10 p-5">
            <h3 className="text-base font-semibold text-white">Agent knowledge base</h3>
          </div>
          <div className="divide-y divide-white/10">
            {knowledgeFields.map(([label, key]) => (
              <div key={key} className="p-5">
                <p className="text-sm font-medium text-zinc-300">{label}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-500">
                  {business[key] || "Not provided yet"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Objection Brain */}
      <section className="glass">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Objection Brain</h3>
              <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-400">
                An AI-built playbook of likely objections and on-brand rebuttals. Your voice agent uses it
                live on every call to handle pushback confidently.
              </p>
            </div>
          </div>
          <Button
            onClick={generatePlaybook}
            disabled={generating}
            className="shrink-0 bg-gradient-to-r from-emerald-400 to-cyan-400 font-medium text-black shadow-glow-emerald hover:opacity-90"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {playbook ? "Regenerate" : "Generate playbook"}
          </Button>
        </div>
        <div className="p-5">
          <Textarea
            value={playbook}
            onChange={(e) => setPlaybook(e.target.value)}
            placeholder="No playbook yet — generate one from your business profile, or write your own. Format: 'Objection: ...' then 'Response: ...'"
            className="min-h-48 border-white/10 bg-black/20 text-sm leading-6 text-zinc-200"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Edits are saved to your profile and applied on the next call.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={savePlaybook}
              disabled={savingPlaybook || playbook === (business.objectionPlaybook || "")}
              className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
            >
              {savingPlaybook ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : playbookSaved ? (
                <Check className="h-3.5 w-3.5 text-emerald-300" />
              ) : null}
              {playbookSaved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileValue({ value, isWebsite = false }) {
  if (!value) {
    return <span className="text-zinc-600">Not provided</span>;
  }

  if (isWebsite) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200"
      >
        {value}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    );
  }

  return <span className="text-zinc-300">{value}</span>;
}
