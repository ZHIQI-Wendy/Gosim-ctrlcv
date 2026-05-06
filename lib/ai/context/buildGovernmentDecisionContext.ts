import { buildOrderContext } from "@/lib/ai/context/buildOrderContext";
import { GameState, GovernmentDecisionInput } from "@/types";

export function buildGovernmentDecisionContext(
  state: GameState,
  recentEvents: string[] = []
): GovernmentDecisionInput {
  const orderContext = buildOrderContext(state);
  return {
    currentTimeMinutes: state.currentTimeMinutes,
    publicState: {
      parisThreat: state.parisThreat,
      cityStability: state.cityStability,
      politicalPressure: state.politicalPressure,
      commandCohesion: state.commandCohesion,
      railwayCongestion: state.railwayCongestion,
      alliedOperationalMomentum: state.alliedOperationalMomentum,
      germanOperationalMomentum: state.germanOperationalMomentum
    },
    hiddenState: {
      governmentCollapseRisk: state.governmentCollapseRisk,
      invalidCommandsInLast6Hours: state.invalidCommandsInLast6Hours,
      threatAbove95Minutes: state.threatAbove95Minutes,
      parisContestedMinutes: state.parisContestedMinutes
    },
    activeOrders: orderContext.activeOrders,
    recentOrders: orderContext.recentOrders,
    recentEvents: recentEvents.slice(-12)
  };
}
