"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, MessageSquareText, Send, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/features/workspace/ui";

const CHANNELS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "SMS", label: "SMS" },
  { value: "EMAIL", label: "Email" },
];

const STATUS_STYLES = {
  DRAFT: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  SENT: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  FAILED: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};

export default function FollowUpsPage() {
  const [contacts, setContacts] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactId, setContactId] = useState("");
  const [channel, setChannel] = useState("WHATSAPP");
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [improvingId, setImprovingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [c, f] = await Promise.all([
        apiClient.get("/api/contacts"),
        apiClient.get("/api/follow-ups"),
      ]);
      setContacts(c.data || []);
      setFollowUps(f.data || []);
    } catch (e) {
      console.error("Failed to load follow-ups", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    if (!contactId) {
      toast.error("Pick a contact first.");
      return;
    }
    setGenerating(true);
    try {
      const res = await apiClient.post("/api/follow-ups/generate", { contactId, channel });
      setFollowUps((prev) => [res.data, ...prev]);
      toast.success("Follow-up drafted.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't generate the follow-up.");
    } finally {
      setGenerating(false);
    }
  };

  const editMessage = (id, message) =>
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, message } : f)));

  const saveMessage = async (f) => {
    try {
      await apiClient.put(`/api/follow-ups/${f.id}`, { message: f.message });
    } catch (e) {
      console.error("Failed to save edit", e);
    }
  };

  const send = async (f) => {
    setBusyId(f.id);
    try {
      await saveMessage(f);
      const res = await apiClient.post(`/api/follow-ups/${f.id}/send`, { channel: f.channel });
      setFollowUps((prev) => prev.map((x) => (x.id === f.id ? res.data : x)));
      if (res.data?.status === "SENT") toast.success(`Sent to ${f.contactName}.`);
      else toast.error(res.data?.errorMessage || "Send failed.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't send the follow-up.");
    } finally {
      setBusyId(null);
    }
  };

  const improve = async (f) => {
    setImprovingId(f.id);
    try {
      await saveMessage(f);
      const res = await apiClient.post(`/api/follow-ups/${f.id}/improve`);
      setFollowUps((prev) => prev.map((x) => (x.id === f.id ? res.data : x)));
      toast.success("Draft polished.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't improve the draft.");
    } finally {
      setImprovingId(null);
    }
  };

  const copy = async (f) => {
    await navigator.clipboard.writeText(f.message || "");
    setCopiedId(f.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const remove = async (f) => {
    try {
      await apiClient.delete(`/api/follow-ups/${f.id}`);
      setFollowUps((prev) => prev.filter((x) => x.id !== f.id));
    } catch (e) {
      toast.error("Couldn't delete.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Generator */}
      <GlassCard className="glass-panel animate-rise p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            <Sparkles className="h-3 w-3 text-emerald-300" />
            AI follow-ups
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Follow-ups</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
            Draft a personalized message from each lead&apos;s call &amp; consultation insights, then send it
            over WhatsApp or SMS.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Contact</label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white">
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName} · {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Channel</label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((ch) => (
                    <SelectItem key={ch.value} value={ch.value}>
                      {ch.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generate}
              disabled={generating}
              className="group relative h-11 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 font-medium text-black shadow-glow-emerald"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* List */}
      {loading ? (
        <GlassCard className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
        </GlassCard>
      ) : followUps.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-zinc-500">
            <MessageSquareText className="h-7 w-7" />
          </span>
          <p className="text-base font-medium text-white">No follow-ups yet</p>
          <p className="text-sm text-zinc-500">Generate one above from a contact you&apos;ve called.</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {followUps.map((f) => (
            <GlassCard key={f.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{f.contactName}</p>
                  <p className="font-mono text-xs text-zinc-500">{f.contactPhone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-zinc-300">
                    {f.channel}
                  </span>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                      STATUS_STYLES[f.status] || STATUS_STYLES.DRAFT
                    )}
                  >
                    {f.status}
                  </span>
                </div>
              </div>

              <Textarea
                value={f.message || ""}
                onChange={(e) => editMessage(f.id, e.target.value)}
                onBlur={() => saveMessage(f)}
                disabled={f.status === "SENT"}
                className="mt-4 min-h-28 border-white/10 bg-black/20 text-sm leading-6 text-zinc-200"
              />

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copy(f)}
                    className="h-8 rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                  >
                    {copiedId === f.id ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy
                  </Button>
                  {f.status !== "SENT" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => improve(f)}
                      disabled={improvingId === f.id}
                      className="h-8 rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                      title="Polish tone & length with AI"
                    >
                      {improvingId === f.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                      Improve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(f)}
                    className="h-8 rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {f.status !== "SENT" && (
                  <Button
                    size="sm"
                    onClick={() => send(f)}
                    disabled={busyId === f.id || f.channel === "EMAIL"}
                    className="h-8 rounded-lg bg-emerald-400/15 px-3 text-emerald-300 hover:bg-emerald-400/25"
                    title={f.channel === "EMAIL" ? "Email sending isn't enabled — copy the text" : undefined}
                  >
                    {busyId === f.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
