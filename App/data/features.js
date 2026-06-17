import {
  BarChart3,
  CalendarClock,
  FileSpreadsheet,
  MessageSquareText,
  PhoneCall,
  Sparkles,
} from "lucide-react";

export const features = [
  {
    icon: <FileSpreadsheet className="w-10 h-10 mb-4 text-primary" />,
    title: "Target Contact Import",
    description:
      "Upload business lead CSVs, map columns, validate contact data, and prepare clean outreach lists.",
  },
  {
    icon: <PhoneCall className="w-10 h-10 mb-4 text-primary" />,
    title: "AI Voice Outreach",
    description:
      "Schedule professional AI phone calls that introduce your offer, qualify leads, and collect details.",
  },
  {
    icon: <Sparkles className="w-10 h-10 mb-4 text-primary" />,
    title: "Lead Intelligence",
    description:
      "Extract intent, pain points, objections, urgency, budget, and next actions from every call.",
  },
  {
    icon: <BarChart3 className="w-10 h-10 mb-4 text-primary" />,
    title: "Campaign Analytics",
    description:
      "See which audiences, sources, scripts, and offers create qualified conversations.",
  },
  {
    icon: <MessageSquareText className="w-10 h-10 mb-4 text-primary" />,
    title: "Follow-up Generator",
    description:
      "Generate WhatsApp, email, and callback tasks based on real conversation outcomes.",
  },
  {
    icon: <CalendarClock className="w-10 h-10 mb-4 text-primary" />,
    title: "Call Scheduling",
    description:
      "Plan outreach windows, retries, and call queues around each business's working hours.",
  },
];
