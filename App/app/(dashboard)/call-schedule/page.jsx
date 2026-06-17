import SectionPlaceholder from "@/components/features/workspace/SectionPlaceholder";

export default function CallSchedulePage() {
  return (
    <SectionPlaceholder
      eyebrow="Scheduling"
      title="Call Schedule"
      description="This section will queue individual and bulk AI calls using business working hours, timezone, retry rules, and campaign priority."
      nextStep="Scheduling becomes active after campaigns can generate call jobs."
    >
      <div className="grid gap-4 md:grid-cols-4">
        {["Queued", "Calling", "Retry", "Completed"].map((status) => (
          <div key={status} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-zinc-400">{status}</p>
            <p className="mt-2 text-2xl font-semibold text-white">0</p>
          </div>
        ))}
      </div>
    </SectionPlaceholder>
  );
}
