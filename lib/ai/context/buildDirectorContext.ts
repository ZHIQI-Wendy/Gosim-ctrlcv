import { buildOrderContext } from "@/lib/ai/context/buildOrderContext";
import { DirectorInput, GameState, MapNodeId } from "@/types";

type DirectorContextOptions = {
  eventType: DirectorInput["eventType"];
  recentEvents?: string[];
  combatContext?: {
    nodeId: MapNodeId;
    alliedLoss: number;
    germanLoss: number;
  };
};

export function buildDirectorContext(state: GameState, options: DirectorContextOptions): DirectorInput {
  const orderContext = buildOrderContext(state);
  return {
    currentTimeMinutes: state.currentTimeMinutes,
    sourceStateVersion: state.stateVersion,
    eventType: options.eventType,
    publicState: {
      parisThreat: state.parisThreat,
      cityStability: state.cityStability,
      politicalPressure: state.politicalPressure,
      commandCohesion: state.commandCohesion,
      railwayCongestion: state.railwayCongestion,
      alliedOperationalMomentum: state.alliedOperationalMomentum,
      germanOperationalMomentum: state.germanOperationalMomentum,
      observedFlankGap: state.observedFlankGap
    },
    hiddenState: {
      governmentCollapseRisk: state.governmentCollapseRisk,
      invalidCommandsInLast6Hours: state.invalidCommandsInLast6Hours,
      threatAbove95Minutes: state.threatAbove95Minutes,
      parisContestedMinutes: state.parisContestedMinutes,
      flankGap: state.flankGap
    },
    combatContext: options.combatContext,
    activeOrders: orderContext.activeOrders,
    recentOrders: orderContext.recentOrders,
    recentEvents: (options.recentEvents ?? []).slice(-12)
  };
}
