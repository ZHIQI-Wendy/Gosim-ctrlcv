import { EnvironmentalAdjudicatorInput, EnvironmentalAdjudicatorOutput } from "@/types";

export function environmentalAdjudicatorMock(
  input: EnvironmentalAdjudicatorInput
): EnvironmentalAdjudicatorOutput {
  const highPressure = input.globalState.parisThreat > 85 || input.globalState.railwayCongestion > 85;
  if (!highPressure) {
    return {
      modifierType: "no_modifier",
      affectedSide: "none",
      affectedUnitIds: [],
      numericModifiers: {
        extraStrengthLossPct: 0,
        moraleDelta: 0,
        fatigueDelta: 0,
        movementDelayMinutes: 0,
        nodeControlDelta: 0
      },
      severity: "minor",
      durationMinutes: 0,
      rationale: "No strong environmental trigger detected."
    };
  }

  return {
    modifierType: "morale_shift",
    affectedSide: "both",
    affectedUnitIds: input.involvedUnits.slice(0, 4).map((unit) => unit.unitId),
    numericModifiers: {
      extraStrengthLossPct: 0,
      moraleDelta: -2,
      fatigueDelta: 2,
      movementDelayMinutes: 10,
      nodeControlDelta: 0
    },
    severity: "medium",
    durationMinutes: 30,
    rationale: "Operational friction under high pressure reduced effectiveness."
  };
}
