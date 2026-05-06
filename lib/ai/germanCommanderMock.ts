import { GermanAgentInput, GermanAgentOutput, MapNodeId } from "@/types";
import { clamp } from "@/lib/utils";

const PARIS_ROUTE_PRIORITY: MapNodeId[] = ["meaux", "ourcq_line", "marne_crossings", "paris_rail_hub"];

function bestTarget(input: GermanAgentInput): MapNodeId {
  for (const preferred of PARIS_ROUTE_PRIORITY) {
    if (input.visibleNodes.some((node) => node.nodeId === preferred)) return preferred;
  }
  return input.visibleNodes[0]?.nodeId ?? "meaux";
}

export function germanCommanderMock(input: GermanAgentInput): GermanAgentOutput {
  const attackChance = clamp(
    0.25 + input.strategicState.germanOperationalMomentum / 250 - input.strategicState.flankGap / 300,
    0.1,
    0.65
  );

  const roll = Math.random();
  const targetNodeId = bestTarget(input);

  if (input.strategicState.flankGap > 65 && roll < 0.4) {
    return {
      action: "REDEPLOY",
      targetNodeId: "aisne_road",
      unitIds: input.availableUnitIds.slice(0, 2),
      stance: "cautious",
      intensity: "medium",
      expectedEffect: {
        targetPressure: -5,
        supplyRisk: -8,
        flankRisk: -14
      },
      confidence: 0.61,
      rationale: "High flank risk favors regrouping toward aisne_road.",
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: 1
    };
  }

  if (roll < attackChance) {
    return {
      action: "ATTACK",
      targetNodeId,
      unitIds: input.availableUnitIds.slice(0, 3),
      stance: "aggressive",
      intensity: "high",
      expectedEffect: {
        targetPressure: 12,
        supplyRisk: 7,
        flankRisk: 5
      },
      confidence: 0.68,
      rationale: "Momentum supports pressure against Paris approach routes.",
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: 1
    };
  }

  return {
    action: "ADVANCE",
    targetNodeId,
    unitIds: input.availableUnitIds.slice(0, 2),
    stance: "balanced",
    intensity: "medium",
    expectedEffect: {
      targetPressure: 6,
      supplyRisk: 4,
      flankRisk: 3
    },
    confidence: 0.56,
    rationale: "Advance while preserving operational coherence.",
    sourceGameTimeMinutes: input.currentTimeMinutes,
    sourceStateVersion: 1
  };
}
