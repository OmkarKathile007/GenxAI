import { BarChart3, Building2, CalendarClock, FileSpreadsheet } from "lucide-react";

export const howItWorks = [
  {
    title: "Create Business Profile",
    description: "Add products, audience, FAQs, tone, language, and sales goals.",
    icon: <Building2 className="w-8 h-8 text-primary" />,
  },
  {
    title: "Upload Contacts",
    description: "Import targeted lead CSVs and segment by source or campaign.",
    icon: <FileSpreadsheet className="w-8 h-8 text-primary" />,
  },
  {
    title: "Schedule Calls",
    description: "Queue AI voice calls around working hours and retry rules.",
    icon: <CalendarClock className="w-8 h-8 text-primary" />,
  },
  {
    title: "Analyze Revenue Signals",
    description: "Convert transcripts into lead scores, objections, and next actions.",
    icon: <BarChart3 className="w-8 h-8 text-primary" />,
  },
];
