import checklistsData from "@/lib/checklistsData.json";

// Content build (Decision #96) -- Emergency Checklists + the event-specific
// cards on the Disaster Response Center both read from this single source,
// so the in-app version and the PDF generator (01_Brand/Emergency-Checklists/
// generate.js, which reads the same JSON file directly via require()) can
// never drift apart into two different lists of steps for the same event.

export type ChecklistSlug = "water-damage" | "fire-damage" | "wind-hail" | "theft";

export type ChecklistGroup = {
  title: string;
  items: string[];
};

export type Checklist = {
  slug: ChecklistSlug;
  eventType: string;
  title: string;
  description: string;
  pdfFile: string;
  groups: ChecklistGroup[];
};

export const CHECKLISTS: Checklist[] = checklistsData as Checklist[];

export function getChecklist(slug: string): Checklist | undefined {
  return CHECKLISTS.find((c) => c.slug === slug);
}
