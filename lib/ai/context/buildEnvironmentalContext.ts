import { CombatEvent } from "@/lib/combat";
import { EnvironmentalAdjudicatorInput, GameState } from "@/types";

export function buildEnvironmentalContext(
  state: GameState,
  event: CombatEvent
): EnvironmentalAdjudicatorInput {
  const node = state.nodes.find((item) => item.id === event.nodeId);
  const involvedUnits = state.units
    .filter((unit) => event.involvedUnitIds.includes(unit.id))
    .map((unit) => ({
      unitId: unit.id,
      side: unit.side,
      stance: unit.stance,
      strength: unit.strength,
      morale: unit.morale,
      fatigue: unit.fatigue,
      supply: unit.supply,
      cohesion: unit.cohesion
    }));

  return {
    eventType: "combat",
    currentTimeMinutes: state.currentTimeMinutes,
    nodeContext: node
      ? {
          nodeId: node.id,
          terrain: node.type,
          control: node.control,
          defenseValue: node.defenseValue,
          transportValue: node.transportValue
        }
      : undefined,
    involvedUnits,
    baseResult: {
      alliedLoss: event.alliedLoss,
      germanLoss: event.germanLoss,
      nodeControlDelta: 0,
      moraleDelta: 0,
      fatigueDelta: 0
    },
    globalState: {
      parisThreat: state.parisThreat,
      railwayCongestion: state.railwayCongestion,
      cityStability: state.cityStability,
      politicalPressure: state.politicalPressure,
      flankGap: state.flankGap
    }
  };
}
