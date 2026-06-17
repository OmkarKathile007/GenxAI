"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileSpreadsheet, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import apiClient from "@/lib/apiClient";
import { parseContactsFile } from "@/lib/parseContactsFile";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/features/workspace/ui";

const PREVIEW_LIMIT = 8;

export default function ImportsPage() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setFileName("");
    setRows([]);
    setColumns([]);
  };

  const ingest = async (file) => {
    if (!file) return;
    setParsing(true);
    try {
      const { rows: parsed, total, detectedColumns } = await parseContactsFile(file);
      if (!total) {
        toast.error("No usable rows found. The sheet needs at least a name and phone column.");
        reset();
        return;
      }
      setFileName(file.name);
      setRows(parsed);
      setColumns(detectedColumns);
    } catch (e) {
      console.error("Parse failed", e);
      toast.error("Couldn't read that file. Use a .csv, .xlsx or .xls export.");
    } finally {
      setParsing(false);
    }
  };

  const onFileInput = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    ingest(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    ingest(e.dataTransfer.files?.[0]);
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      const res = await apiClient.post("/api/contacts/import", { contacts: rows, source: "CSV" });
      const { created, duplicates, skipped } = res.data || {};
      toast.success(
        `Imported ${created} contact${created === 1 ? "" : "s"}` +
          (duplicates ? ` · ${duplicates} duplicate(s) skipped` : "") +
          (skipped ? ` · ${skipped} invalid row(s)` : "")
      );
      router.push("/contacts");
    } catch (e) {
      console.error("Import failed", e);
      toast.error(e?.response?.data?.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  const hasData = rows.length > 0;

  return (
    <div className="space-y-6">
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onFileInput} className="hidden" />

      <GlassCard className="glass-panel animate-rise p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            <FileSpreadsheet className="h-3 w-3 text-cyan-300" />
            CSV / Excel intake
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Import contacts</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-400">
            Drop a customer sheet — we auto-detect name, phone, email, company and source columns,
            preview the rows, then create your contact entries.
          </p>
        </div>
      </GlassCard>

      {!hasData ? (
        <GlassCard className="p-6 md:p-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-16 text-center transition-colors ${
              dragging ? "border-emerald-400/50 bg-emerald-400/[0.05]" : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04]"
            }`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-emerald-300">
              {parsing ? <Loader2 className="h-7 w-7 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
            </span>
            <div>
              <p className="text-base font-medium text-white">
                {parsing ? "Reading file…" : "Drop your CSV/Excel here, or click to browse"}
              </p>
              <p className="mt-1 text-sm text-zinc-500">Supports .csv, .xlsx and .xls</p>
            </div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-emerald-300" />
              <div>
                <p className="text-sm font-medium text-white">{fileName}</p>
                <p className="text-xs text-zinc-500">
                  {rows.length} valid row{rows.length === 1 ? "" : "s"} · detected:{" "}
                  {columns.length ? columns.join(", ") : "name/phone"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={reset}
                className="h-9 rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
              <Button
                onClick={confirmImport}
                disabled={importing}
                className="group relative h-9 overflow-hidden rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 font-medium text-black shadow-glow-emerald"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Import {rows.length}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {rows.slice(0, PREVIEW_LIMIT).map((r, i) => (
                  <tr key={i} className="text-zinc-300">
                    <td className="px-5 py-3 font-medium text-white">{r.fullName || "—"}</td>
                    <td className="px-5 py-3 font-mono">{r.phone || "—"}</td>
                    <td className="px-5 py-3 text-zinc-400">{r.email || "—"}</td>
                    <td className="px-5 py-3 text-zinc-400">{r.company || "—"}</td>
                    <td className="px-5 py-3 text-zinc-400">{r.source || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > PREVIEW_LIMIT && (
              <p className="px-5 py-3 text-xs text-zinc-500">
                + {rows.length - PREVIEW_LIMIT} more row{rows.length - PREVIEW_LIMIT === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
