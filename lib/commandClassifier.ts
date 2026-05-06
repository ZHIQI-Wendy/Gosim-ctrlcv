import { frenchCommandParserMock } from "@/lib/ai/frenchCommandParserMock";
import { FrenchCommandParserOutput, GameState, MapNodeId } from "@/types";

export function classifyCommand(
  state: GameState,
  inputText: string,
  selectedNodeId?: MapNodeId,
  selectedUnitId?: string
): FrenchCommandParserOutput {
  return frenchCommandParserMock({
    rawText: inputText,
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
    activeOrders: [],
    recentOrders: [],
    recentEvents: []
  });
}
