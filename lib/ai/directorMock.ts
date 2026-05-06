import { DirectorInput, DirectorOutput } from "@/types";

export function directorMock(input: DirectorInput): DirectorOutput {
  const crisis =
    input.publicState.parisThreat > 75 ||
    input.publicState.politicalPressure > 75 ||
    input.publicState.cityStability < 45 ||
    input.hiddenState.governmentCollapseRisk > 65 ||
    Boolean(input.combatContext);

  if (!crisis) {
    return {
      trigger: false,
      action: "NO_ACTION",
      publicMessage: "Director observes without changing operational conditions.",
      stateDelta: {
        cityStability: 0,
        politicalPressure: 0,
        commandCohesion: 0,
        governmentCollapseRisk: 0,
        alliedOperationalMomentum: 0,
        germanOperationalMomentum: 0,
        railwayCongestion: 0,
        shortTermRedeployDelayMinutes: 0
      },
      unitDelta: [],
      nodeDelta: [],
      severity: "minor",
      confidence: 0.7,
      privateRationale: "No crisis threshold or combat friction justified intervention.",
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  const impactedUnitIds =
    input.combatContext && input.activeOrders.length > 0
      ? input.activeOrders.slice(0, 2).flatMap((order) => (order.unitId ? [order.unitId] : []))
      : [];

  return {
    trigger: true,
    action: input.combatContext ? "COMBAT_FRICTION" : "EMERGENCY_DIRECTIVE",
    publicMessage: input.combatContext
      ? "Director applied combat and logistics friction to the active sector."
      : "Director issued an emergency stabilizing directive across the theater.",
    stateDelta: {
      cityStability: input.combatContext ? -1 : 4,
      politicalPressure: input.combatContext ? 2 : -4,
      commandCohesion: input.combatContext ? -1 : 3,
      governmentCollapseRisk: input.combatContext ? 1 : -5,
      alliedOperationalMomentum: input.combatContext ? -1 : 2,
      germanOperationalMomentum: input.combatContext ? 1 : 0,
      railwayCongestion: input.combatContext ? 4 : -2,
      shortTermRedeployDelayMinutes: input.combatContext ? 10 : 0
    },
    unitDelta: impactedUnitIds.map((unitId) => ({
      unitId,
      strengthDeltaPct: 0,
      moraleDelta: -2,
      fatigueDelta: 2,
      supplyDelta: -1,
      cohesionDelta: -1,
      readinessDelta: 0
    })),
    nodeDelta: input.combatContext
      ? [
          {
            nodeId: input.combatContext.nodeId,
            controlPressureDelta: -3,
            defenseValueDelta: 0,
            supplyValueDelta: 0,
            transportValueDelta: -1
          }
        ]
      : [],
    severity: input.combatContext ? "medium" : "major",
    confidence: 0.65,
    privateRationale: "Director merges political stabilization with local friction adjudication.",
    sourceGameTimeMinutes: input.currentTimeMinutes,
    sourceStateVersion: input.sourceStateVersion
  };
}
