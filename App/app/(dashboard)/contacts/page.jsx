"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Loader2,
  MessageCircle,
  Phone,
  Send,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import apiClient from "@/lib/apiClient";
import { parseContactsFile } from "@/lib/parseContactsFile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/features/workspace/ui";

const STATUS_STYLES = {
  NEW: "border-white/10 bg-white/[0.04] text-zinc-300",
  CALLING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  CALLED: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  INVITED: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  QUALIFIED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  FAILED: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [callingEnabled, setCallingEnabled] = useState(true);
  const [busyId, setBusyId] = useState(null); // contactId currently calling/inviting
  const fileRef = useRef(null);

  const loadContacts = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/contacts");
      setContacts(res.data || []);
    } catch (e) {
      console.error("Failed to load contacts", e);
      toast.error("Couldn't load contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
    apiClient
      .get("/api/calls/config")
      .then((res) => setCallingEnabled(Boolean(res.data?.callingEnabled)))
      .catch(() => setCallingEnabled(false));
  }, [loadContacts]);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setImporting(true);
    try {
      const { rows, total } = await parseContactsFile(file);
      if (!total) {
        toast.error("No usable rows found. Make sure there's a name and phone column.");
        return;
      }
      const res = await apiClient.post("/api/contacts/import", {
        contacts: rows,
        source: "CSV",
      });
      const { created, duplicates, skipped } = res.data || {};
      toast.success(
        `Imported ${created} contact${created === 1 ? "" : "s"}` +
          (duplicates ? ` · ${duplicates} duplicate${duplicates === 1 ? "" : "s"} skipped` : "") +
          (skipped ? ` · ${skipped} invalid row${skipped === 1 ? "" : "s"}` : "")
      );
      await loadContacts();
    } catch (e) {
      console.error("Import failed", e);
      toast.error(e?.response?.data?.message || "Import failed. Check the file format.");
    } finally {
      setImporting(false);
    }
  };

  const callContact = async (contact) => {
    if (!callingEnabled) {
      toast.error("Outbound calling isn't configured yet (Vapi keys + phone number).");
      return;
    }
    setBusyId(contact.id);
    try {
      await apiClient.post(`/api/calls/start/${contact.id}`);
      toast.success(`Calling ${contact.fullName}…`);
      await loadContacts();
    } catch (e) {
      console.error("Call failed", e);
      toast.error(e?.response?.data?.message || "Couldn't start the call.");
    } finally {
      setBusyId(null);
    }
  };

  const sendInvite = async (contact, channel) => {
    setBusyId(contact.id);
    try {
      const res = await apiClient.post(`/api/invites/send/${contact.id}`, { channel });
      if (res.data?.status === "SENT") {
        toast.success(`${channel === "WHATSAPP" ? "WhatsApp" : "SMS"} invite sent to ${contact.fullName}.`);
      } else {
        toast.error(res.data?.errorMessage || "Invite could not be sent.");
      }
      await loadContacts();
    } catch (e) {
      console.error("Invite failed", e);
      toast.error(e?.response?.data?.message || "Couldn't send the invite.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteContact = async (contact) => {
    if (!confirm(`Delete ${contact.fullName}?`)) return;
    try {
      await apiClient.delete(`/api/contacts/${contact.id}`);
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      toast.success("Contact deleted.");
    } catch (e) {
      console.error("Delete failed", e);
      toast.error("Couldn't delete the contact.");
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFile}
        className="hidden"
      />

      {/* Header */}
      <GlassCard className="glass-panel animate-rise p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              <Users className="h-3 w-3 text-emerald-300" />
              Target audience
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Contacts
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
              Import customers from CSV/Excel, then call them with the AI voice agent and send a
              platform invite over SMS or WhatsApp.
            </p>
          </div>
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="group relative h-11 shrink-0 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 font-medium text-black shadow-glow-emerald transition-transform hover:scale-[1.02]"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? "Importing…" : "Import CSV / Excel"}
          </Button>
        </div>
      </GlassCard>

      {!callingEnabled && !loading && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200">
          Outbound calling is off — add <span className="font-mono">VAPI_PRIVATE_KEY</span>,{" "}
          <span className="font-mono">VAPI_ASSISTANT_ID</span> and{" "}
          <span className="font-mono">VAPI_PHONE_NUMBER_ID</span> to the backend env, then restart it.
        </div>
      )}

      {/* Table */}
      <GlassCard className="overflow-hidden p-0">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-zinc-500">
              <Users className="h-7 w-7" />
            </span>
            <div>
              <p className="text-base font-medium text-white">No contacts yet</p>
              <p className="mt-1 text-sm text-zinc-500">
                Import a CSV or Excel sheet to create your customer entries.
              </p>
            </div>
            <Button
              onClick={() => fileRef.current?.click()}
              variant="outline"
              className="rounded-xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07]"
            >
              <Upload className="h-4 w-4" />
              Import contacts
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {contacts.map((c) => {
                  const busy = busyId === c.id;
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-white">{c.fullName}</div>
                        <div className="text-xs text-zinc-500">{c.company || c.email || "—"}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-zinc-300">{c.phone}</td>
                      <td className="px-5 py-3.5 text-zinc-400">{c.source || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium",
                            STATUS_STYLES[c.status] || STATUS_STYLES.NEW
                          )}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => callContact(c)}
                            disabled={busy}
                            className="h-8 rounded-lg bg-emerald-400/15 px-3 text-emerald-300 hover:bg-emerald-400/25"
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Phone className="h-3.5 w-3.5" />
                            )}
                            Call
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                className="h-8 rounded-lg border-white/10 bg-white/[0.03] px-3 text-zinc-200 hover:bg-white/[0.08]"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Invite
                                <ChevronDown className="h-3 w-3 opacity-60" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="border-white/10 bg-[#0d0f14] text-zinc-200"
                            >
                              <DropdownMenuItem
                                onClick={() => sendInvite(c, "WHATSAPP")}
                                className="cursor-pointer focus:bg-white/[0.06] focus:text-white"
                              >
                                <MessageCircle className="h-4 w-4 text-emerald-300" />
                                Send WhatsApp invite
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => sendInvite(c, "SMS")}
                                className="cursor-pointer focus:bg-white/[0.06] focus:text-white"
                              >
                                <Send className="h-4 w-4 text-cyan-300" />
                                Send SMS invite
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteContact(c)}
                            className="h-8 w-8 rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
