import { TOTAL_GAME_HOURS } from "@/data/initialState";
import { averageMorale, isParisHeld, localGermanPowerRatio } from "@/lib/parisThreat";
import { EndingType, GameState } from "@/types";

export function updateSustainedThreatTimers(state: GameState, stepMinutes: number): void {
  if (state.parisThreat >= 95) {
    state.threatAbove95Minutes += stepMinutes;
  } else {
    state.threatAbove95Minutes = 0;
  }

  const parisNode = state.nodes.find((node) => node.id === "paris");
  const germanRatioNearParis = localGermanPowerRatio(state, "paris");
  if (parisNode?.control === "contested" && germanRatioNearParis > 0.65) {
    state.parisContestedMinutes += stepMinutes;
  } else {
    state.parisContestedMinutes = 0;
  }
}

export function resolveEnding(state: GameState): EndingType {
  if (state.outcomeScores.ahistoricalCollapse >= 60) {
    return "ahistoricalCollapse";
  }

  if (state.threatAbove95Minutes >= 180 || state.parisContestedMinutes >= 120) {
    return "germanBreakthrough";
  }

  if (averageMorale(state, "allied") < 20 && state.commandCohesion < 35) {
    return "collapse";
  }

  if (state.politicalPressure > 85 && state.cityStability < 35) {
    return "parisPoliticalCrisis";
  }

  if (state.cityVehiclesUsed && isParisHeld(state) && state.germanOperationalMomentum < 50) {
    return "miracleMarne";
  }

  if (!state.cityVehiclesUsed && state.railwayCongestion < 45 && isParisHeld(state)) {
    return "logisticsMaster";
  }

  if (state.outcomeScores.tacticalGamble >= 25 && state.germanOperationalMomentum < 40) {
    return "tacticalGamble";
  }

  if (isParisHeld(state)) {
    return "costlyStalemate";
  }

  return "germanBreakthrough";
}

export function shouldEndGame(state: GameState): boolean {
  if (state.gameEnded) return true;

  const maxMinutes = TOTAL_GAME_HOURS * 60;
  if (state.currentTimeMinutes >= maxMinutes) return true;

  if (state.threatAbove95Minutes >= 180) return true;
  if (state.parisContestedMinutes >= 120) return true;
  if (averageMorale(state, "allied") < 20 && state.commandCohesion < 35) return true;
  if (state.outcomeScores.ahistoricalCollapse >= 60) return true;

  return false;
}

export const endingNarrative: Record<EndingType, string> = {
  miracleMarne:
    "Miracle on the Marne: Paris held under extreme pressure, and emergency urban mobilization became symbolic strategic leverage.",
  logisticsMaster:
    "Logistics Master: rail and command discipline sustained the line without emergency requisition.",
  tacticalGamble:
    "Tactical Gamble: a high-risk counterstroke exploited the German flank and disrupted operational tempo.",
  costlyStalemate:
    "Costly Stalemate: Paris held, but the front settled into a severe attritional deadlock.",
  parisPoliticalCrisis:
    "Paris Political Crisis: pressure, fear, and instability fractured national confidence despite continued resistance.",
  germanBreakthrough:
    "German Breakthrough: sustained pressure overwhelmed Paris approaches and strategic control collapsed.",
  ahistoricalCollapse:
    "Ahistorical Collapse: repeated unrealistic directives destroyed command coherence and operational realism.",
  collapse:
    "Operational Collapse: morale and command cohesion decayed below recoverable thresholds."
};
