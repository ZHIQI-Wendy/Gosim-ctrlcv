import { GovernmentDecisionInput, GovernmentDecisionOutput } from "@/types";

export function governmentDecisionMock(
  input: GovernmentDecisionInput
): GovernmentDecisionOutput {
  const trigger =
    input.publicState.parisThreat > 75 ||
    input.publicState.politicalPressure > 75 ||
    input.publicState.cityStability < 45 ||
    input.hiddenState.governmentCollapseRisk > 65 ||
    input.hiddenState.invalidCommandsInLast6Hours >= 2;

  if (!trigger) {
    return {
      trigger: false,
      action: "NO_ACTION",
      publicMessage: "Cabinet monitoring continues without formal intervention.",
      stateDelta: {
        cityStability: 0,
        politicalPressure: 0,
        commandCohesion: 0,
        governmentCollapseRisk: 0,
        alliedOperationalMomentum: 0
      },
      durationMinutes: 0,
      severity: "minor",
      confidence: 0.65,
      privateRationale: "No intervention threshold triggered.",
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: 1
    };
  }

  return {
    trigger: true,
    action: "EMERGENCY_DIRECTIVE",
    publicMessage: "Government issues emergency direction to maintain order and military coherence.",
    stateDelta: {
      cityStability: 4,
      politicalPressure: -5,
      commandCohesion: 4,
      governmentCollapseRisk: -6,
      alliedOperationalMomentum: 2
    },
    durationMinutes: 120,
    severity: "medium",
    confidence: 0.62,
    privateRationale: "Political intervention stabilizes command and home-front pressure.",
    sourceGameTimeMinutes: input.currentTimeMinutes,
    sourceStateVersion: 1
  };
}
