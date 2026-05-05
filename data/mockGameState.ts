import { CityId, OutcomeKey, StrategicFocus } from "@/types";

export const cityNodes: Array<{ id: CityId; label: string; x: number; y: number }> = [
  { id: "paris", label: "Paris", x: 30, y: 33 },
  { id: "meaux", label: "Meaux", x: 42, y: 38 },
  { id: "chateauThierry", label: "Chateau-Thierry", x: 48, y: 46 },
  { id: "marne", label: "Marne", x: 47, y: 43 },
  { id: "reims", label: "Reims", x: 59, y: 31 },
  { id: "verdun", label: "Verdun", x: 72, y: 46 }
];

export const strategyOptions: Array<{
  focus: StrategicFocus;
  title: string;
  detail: string;
  icon: string;
  accent: string;
}> = [
  {
    focus: "DEFEND_PARIS",
    title: "Defend Paris",
    detail: "Strengthen belts around the capital",
    icon: "🛡",
    accent: "#4a76d1"
  },
  {
    focus: "DELAY_GERMANS",
    title: "Delay Germans",
    detail: "Trade space for critical hours",
    icon: "⏳",
    accent: "#bc4b3d"
  },
  {
    focus: "COUNTER_STRIKE",
    title: "Launch Counterattack",
    detail: "Hit exposed advance corridors",
    icon: "⚔",
    accent: "#c9a449"
  },
  {
    focus: "OPTIMIZE_RAILWAYS",
    title: "Optimize Supply",
    detail: "Rebuild rail transfer priority",
    icon: "🛤",
    accent: "#4b9b6c"
  },
  {
    focus: "BOOST_RECON",
    title: "Strengthen Recon",
    detail: "Increase operational visibility",
    icon: "🔭",
    accent: "#7d63b7"
  }
];

export const outcomeLabels: Record<OutcomeKey, string> = {
  miracleMarne: "Miracle at the Marne",
  logisticsMaster: "Logistics Master",
  tacticalGamble: "Tactical Gamble",
  costlyStalemate: "Costly Stalemate",
  parisPoliticalCrisis: "Paris Political Crisis",
  germanBreakthrough: "German Breakthrough",
  ahistoricalCollapse: "Ahistorical Collapse"
};
