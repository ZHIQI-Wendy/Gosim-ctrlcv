import { AllowedAction, MapNodeId, OutcomeKey } from "@/types";

export const cityNodes: Array<{ id: MapNodeId; label: string; x: number; y: number }> = [
  { id: "paris", label: "Paris", x: 30, y: 33 },
  { id: "meaux", label: "Meaux", x: 42, y: 38 },
  { id: "chateau_thierry", label: "Chateau-Thierry", x: 48, y: 46 },
  { id: "marne_crossings", label: "Marne Crossings", x: 47, y: 43 },
  { id: "reims", label: "Reims", x: 59, y: 31 },
  { id: "verdun", label: "Verdun", x: 72, y: 46 }
];

export const strategyOptions: Array<{
  action: AllowedAction;
  title: string;
  detail: string;
  icon: string;
  commandText: string;
}> = [
  {
    action: "DEFEND",
    title: "Defend Paris",
    detail: "Strengthen belts around the capital",
    icon: "S",
    commandText: "Defend Paris approaches and hold key crossings."
  },
  {
    action: "DELAY",
    title: "Delay Germans",
    detail: "Trade space for critical hours",
    icon: "T",
    commandText: "Delay German advance and buy time near the Marne."
  },
  {
    action: "COUNTERATTACK",
    title: "Counterattack",
    detail: "Hit exposed advance corridors",
    icon: "A",
    commandText: "Launch a local counterattack on the exposed German flank."
  },
  {
    action: "OPTIMIZE_RAIL",
    title: "Optimize Rail",
    detail: "Rebuild rail transfer priority",
    icon: "R",
    commandText: "Optimize rail throughput around Paris rail hub."
  },
  {
    action: "RECON",
    title: "Strengthen Recon",
    detail: "Increase operational visibility",
    icon: "I",
    commandText: "Recon and observe German flank movement."
  },
  {
    action: "PROPAGANDA",
    title: "Public Messaging",
    detail: "Stabilize morale and confidence",
    icon: "P",
    commandText: "Issue messaging to stabilize morale in Paris."
  }
];

export const outcomeLabels: Record<OutcomeKey, string> = {
  miracleMarne: "Miracle at the Marne",
  logisticsMaster: "Logistics Master",
  tacticalGamble: "Tactical Gamble",
  costlyStalemate: "Costly Stalemate",
  parisPoliticalCrisis: "Paris Political Crisis",
  germanBreakthrough: "German Breakthrough",
  ahistoricalCollapse: "Ahistorical Collapse",
  collapse: "Operational Collapse"
};
