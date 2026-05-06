import { buildOrderContext } from "@/lib/ai/context/buildOrderContext";
import { FrenchCommandParserInput, GameState, MapNodeId } from "@/types";

export function buildFrenchCommandContext(
  state: GameState,
  rawText: string,
  selectedNodeId?: MapNodeId,
  selectedUnitId?: string,
  recentEvents: string[] = []
): FrenchCommandParserInput {
  const normalizedText = rawText.replace(/^\s*/i, "").trim();
  const orderContext = buildOrderContext(state);
  return {
    rawText: normalizedText,
    selectedNodeId,
    selectedUnitId,
    visibleState: {
      currentTimeMinutes: state.currentTimeMinutes,
      parisThreat: state.parisThreat,
      observedFlankGap: state.observedFlankGap,
      railwayCongestion: state.railwayCongestion,
      cityVehiclesDiscovered: state.cityVehiclesDiscovered,
      knownNodes: state.nodes.map((node) => node.id),
      knownUnits: state.units.filter((unit) => unit.side === "allied").map((unit) => unit.id)
    },
    activeOrders: orderContext.activeOrders,
    recentOrders: orderContext.recentOrders,
    recentEvents: recentEvents.slice(-12)
  };
}
