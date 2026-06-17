import SectionPlaceholder from "@/components/features/workspace/SectionPlaceholder";

export default function CampaignsPage() {
  return (
    <SectionPlaceholder
      eyebrow="Voice outreach"
      title="Campaigns"
      description="Campaigns define the offer, audience, call goal, qualification questions, retry rules, and schedule window for AI voice outreach."
      nextStep="After imports, we will connect contacts to campaigns and create call jobs."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {["Demo booking campaign", "User research campaign"].map((item) => (
          <div key={item} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-white">{item}</p>
            <p className="mt-2 text-sm text-zinc-500">Template planned for the campaign builder.</p>
          </div>
        ))}
      </div>
    </SectionPlaceholder>
  );
}
