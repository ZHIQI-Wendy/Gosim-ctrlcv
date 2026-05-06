import { buildOrderContext } from "@/lib/ai/context/buildOrderContext";
import { GameState, ReportGeneratorInput, ReportTone } from "@/types";

export type PublicEvent = {
  type: string;
  nodeId?: ReportGeneratorInput["latestEvents"][number]["nodeId"];
  unitIds?: string[];
  resultSummary: string;
};

export function buildReportContext(
  state: GameState,
  latestEvents: PublicEvent[],
  tone: ReportTone = "staff_report"
): ReportGeneratorInput {
  const orderContext = buildOrderContext(state);
  return {
    currentTimeMinutes: state.currentTimeMinutes,
    sourceStateVersion: state.stateVersion,
    publicState: {
      parisThreat: state.parisThreat,
      observedFlankGap: state.observedFlankGap,
      cityStability: state.cityStability,
      politicalPressure: state.politicalPressure,
      railwayCongestion: state.railwayCongestion
    },
    latestEvents: latestEvents.slice(-8),
    activeOrders: orderContext.activeOrders,
    recentOrders: orderContext.recentOrders,
    tone
  };
}
