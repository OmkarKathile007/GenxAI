"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  Loader2,
  Megaphone,
  Plus,
  Save,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/features/workspace/ui";
import { cn } from "@/lib/utils";
import { buildCampaignDoc } from "@/lib/campaignDoc";

const EMPTY = {
  name: "",
  productService: "",
  targetAudience: "",
  goal: "",
  offer: "",
  channel: "",
  budget: "",
  timeline: "",
};

const DAY_LABELS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];

/** Parse the stored plan JSON into a normalized, editable structure. */
function parsePlan(raw) {
  if (!raw) return null;
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    const days = Array.isArray(obj.days) ? obj.days : [];
    return {
      summary: obj.summary || "",
      northStarMetric: obj.northStarMetric || "",
      days: days.map((d, i) => ({
        day: d.day || i + 1,
        title: d.title || DAY_LABELS[i] || `Day ${i + 1}`,
        focus: d.focus || "",
        todos: (Array.isArray(d.todos) ? d.todos : []).map((t) =>
          typeof t === "string" ? { text: t, done: false } : { text: t.text || "", done: !!t.done }
        ),
      })),
    };
  } catch {
    return null;
  }
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/campaigns");
      setCampaigns(res.data || []);
    } catch (e) {
      console.error("Failed to load campaigns", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const generate = async () => {
    if (!form.name.trim()) {
      toast.error("Give the campaign a name first.");
      return;
    }
    setGenerating(true);
    try {
      const res = await apiClient.post("/api/campaigns/generate", form);
      setCampaigns((prev) => [res.data, ...prev]);
      setForm(EMPTY);
      toast.success("7-day revenue plan generated.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't generate the plan.");
    } finally {
      setGenerating(false);
    }
  };

  const onDeleted = (id) => setCampaigns((prev) => prev.filter((x) => x.id !== id));
  const onSaved = (updated) =>
    setCampaigns((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));

  return (
    <div className="space-y-6">
      {/* Planner */}
      <GlassCard className="glass-panel animate-rise p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            <Sparkles className="h-3 w-3 text-emerald-300" />
            AI campaign planner
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Campaigns</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
            Describe your offer and audience — the planner builds a <strong className="text-zinc-200">7-day
            revenue plan</strong> with an editable checklist for each day, downloadable as a polished document.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Field label="Campaign name *">
              <Input value={form.name} onChange={set("name")} placeholder="e.g. Weekend Batch Admissions" className="h-11 border-white/10 bg-white/[0.04] text-white" />
            </Field>
            <Field label="Product / service to promote">
              <Input value={form.productService} onChange={set("productService")} placeholder="e.g. JEE crash course" className="h-11 border-white/10 bg-white/[0.04] text-white" />
            </Field>
            <Field label="Target audience">
              <Input value={form.targetAudience} onChange={set("targetAudience")} placeholder="e.g. Class 12 students in Pune" className="h-11 border-white/10 bg-white/[0.04] text-white" />
            </Field>
            <Field label="Primary goal">
              <Input value={form.goal} onChange={set("goal")} placeholder="e.g. Book 50 demo sessions" className="h-11 border-white/10 bg-white/[0.04] text-white" />
            </Field>
            <Field label="Offer / hook">
              <Input value={form.offer} onChange={set("offer")} placeholder="e.g. Free first class + EMI option" className="h-11 border-white/10 bg-white/[0.04] text-white" />
            </Field>
            <Field label="Channels">
              <Input value={form.channel} onChange={set("channel")} placeholder="e.g. Instagram Ads, website forms" className="h-11 border-white/10 bg-white/[0.04] text-white" />
            </Field>
            <Field label="Budget">
              <Input value={form.budget} onChange={set("budget")} placeholder="e.g. ₹50,000 / month" className="h-11 border-white/10 bg-white/[0.04] text-white" />
            </Field>
            <Field label="Timeline">
              <Input value={form.timeline} onChange={set("timeline")} placeholder="e.g. 4 weeks" className="h-11 border-white/10 bg-white/[0.04] text-white" />
            </Field>
          </div>

          <Button
            onClick={generate}
            disabled={generating}
            className="mt-5 h-11 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 font-medium text-black shadow-glow-emerald hover:opacity-90"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate 7-day plan
          </Button>
        </div>
      </GlassCard>

      {/* List */}
      {loading ? (
        <GlassCard className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
        </GlassCard>
      ) : campaigns.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-zinc-500">
            <Megaphone className="h-7 w-7" />
          </span>
          <p className="text-base font-medium text-white">No campaigns yet</p>
          <p className="text-sm text-zinc-500">Fill the brief above and generate your first 7-day plan.</p>
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {campaigns.map((c) => (
            <CampaignBlock key={c.id} campaign={c} onDeleted={onDeleted} onSaved={onSaved} />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignBlock({ campaign, onDeleted, onSaved }) {
  const [plan, setPlan] = useState(() => parsePlan(campaign.plan));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const initial = useRef(campaign.plan);

  // Re-parse if the underlying campaign changes (e.g. after save from server).
  useEffect(() => {
    if (campaign.plan !== initial.current) {
      initial.current = campaign.plan;
      setPlan(parsePlan(campaign.plan));
      setDirty(false);
    }
  }, [campaign.plan]);

  const mutate = (fn) => {
    setPlan((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put(`/api/campaigns/${campaign.id}`, { plan: JSON.stringify(plan) });
      onSaved(res.data);
      setDirty(false);
      toast.success("Plan saved.");
    } catch (e) {
      toast.error("Couldn't save the plan.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await apiClient.delete(`/api/campaigns/${campaign.id}`);
      onDeleted(campaign.id);
    } catch (e) {
      toast.error("Couldn't delete.");
    }
  };

  const download = () => {
    try {
      const html = buildCampaignDoc(campaign, plan);
      const w = window.open("", "_blank");
      if (!w) {
        toast.error("Allow pop-ups to download the document.");
        return;
      }
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 400);
    } catch (e) {
      toast.error("Couldn't build the document.");
    }
  };

  const totalTasks = plan?.days?.reduce((n, d) => n + d.todos.length, 0) || 0;
  const doneTasks = plan?.days?.reduce((n, d) => n + d.todos.filter((t) => t.done).length, 0) || 0;
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <GlassCard className="overflow-hidden p-0">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <Target className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-semibold text-white">{campaign.name}</h3>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
              {campaign.goal && <span>🎯 {campaign.goal}</span>}
              {campaign.channel && <span>📣 {campaign.channel}</span>}
              {campaign.budget && <span>💰 {campaign.budget}</span>}
            </div>
            {plan?.summary && <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{plan.summary}</p>}
            {plan?.northStarMetric && (
              <p className="mt-2 text-xs text-emerald-300/90">
                <span className="text-zinc-500">North-star metric:</span> {plan.northStarMetric}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {dirty && (
            <Button
              size="sm"
              onClick={save}
              disabled={saving}
              className="h-9 rounded-lg bg-emerald-400/15 px-3 text-emerald-300 hover:bg-emerald-400/25"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={download}
            className="h-9 rounded-lg border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={remove}
            className="h-9 rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="nums text-xs text-zinc-400">
            {doneTasks}/{totalTasks} done · {pct}%
          </span>
        </div>
      )}

      {/* Days */}
      {!plan ? (
        <div className="p-6 text-sm text-zinc-500">
          This plan couldn&apos;t be parsed into days. Try regenerating the campaign.
        </div>
      ) : (
        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
          {plan.days.map((d, di) => (
            <DayCard
              key={di}
              index={di}
              day={d}
              mutate={(fn) => mutate((draft) => fn(draft.days[di]))}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function DayCard({ index, day, mutate }) {
  const [adding, setAdding] = useState("");

  const addTask = () => {
    const text = adding.trim();
    if (!text) return;
    mutate((d) => d.todos.push({ text, done: false }));
    setAdding("");
  };

  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-xs font-semibold text-emerald-300">
          {index + 1}
        </span>
        <input
          value={day.title}
          onChange={(e) => mutate((d) => (d.title = e.target.value))}
          placeholder={`Day ${index + 1} theme`}
          className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
        />
      </div>
      <input
        value={day.focus}
        onChange={(e) => mutate((d) => (d.focus = e.target.value))}
        placeholder="Revenue focus for the day"
        className="mb-3 w-full bg-transparent text-xs italic text-zinc-400 outline-none placeholder:text-zinc-600"
      />

      <div className="flex-1 space-y-1.5">
        {day.todos.map((t, ti) => (
          <div key={ti} className="group flex items-start gap-2">
            <button
              onClick={() => mutate((d) => (d.todos[ti].done = !d.todos[ti].done))}
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                t.done
                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                  : "border-white/20 text-transparent hover:border-emerald-400/50"
              )}
            >
              <Check className="h-3 w-3" />
            </button>
            <input
              value={t.text}
              onChange={(e) => mutate((d) => (d.todos[ti].text = e.target.value))}
              className={cn(
                "w-full bg-transparent text-xs leading-5 outline-none",
                t.done ? "text-zinc-500 line-through" : "text-zinc-200"
              )}
            />
            <button
              onClick={() => mutate((d) => d.todos.splice(ti, 1))}
              className="mt-0.5 shrink-0 text-zinc-600 opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <Plus className="h-3.5 w-3.5 text-zinc-600" />
        <input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          onBlur={addTask}
          placeholder="Add task"
          className="w-full bg-transparent text-xs text-zinc-300 outline-none placeholder:text-zinc-600"
        />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}
