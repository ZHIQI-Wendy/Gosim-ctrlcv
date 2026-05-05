import {GameStateData, OutcomeKey} from "@/types";

export function shouldEndGame(state: GameStateData): boolean {
    if (state.ending) return true;
    if (state.timeLeft <= 0) return true;
    if (state.parisThreat >= 100) return true;
    if (state.germanAdvance >= 100) return true;
    if (state.morale <= 0) return true;
    return false;
}

export function resolveEnding(state: GameStateData): OutcomeKey {
    if (state.parisThreat >= 100 || state.germanAdvance >= 100 || state.morale <= 0) {
        return "germanBreakthrough";
    }

    if (state.outcomeScores.ahistoricalCollapse > 50) return "ahistoricalCollapse";
    if (state.cityVehiclesUsed && state.parisThreat < 80) return "miracleMarne";
    if (!state.cityVehiclesUsed && state.railwayCongestion < 50) return "logisticsMaster";
    if (state.flankGap > 70 && state.counterattackSuccess) return "tacticalGamble";
    if (state.politicalPressure > 80) return "parisPoliticalCrisis";
    return "costlyStalemate";
}

export const endingNarrative: Record<OutcomeKey, string> = {
    miracleMarne:
        "Miracle on the Marne: Paris was held and civic mobilization became a symbol of national will.",
    logisticsMaster:
        "Logistics Master: Paris held through disciplined rail coordination without emergency city requisition.",
    tacticalGamble:
        "Tactical Gamble: A risky counterstroke exploited the flank gap and forced a German pause.",
    costlyStalemate:
        "Costly Stalemate: The line held, but both armies paid heavily and no decisive breakthrough emerged.",
    parisPoliticalCrisis:
        "Paris Political Crisis: Military pressure and social strain fractured confidence in national leadership.",
    germanBreakthrough:
        "German Breakthrough: Defensive tempo failed and the German offensive reached strategic dominance.",
    ahistoricalCollapse:
        "Ahistorical Collapse: Repeated unrealistic directives shattered command coherence and battlefield control."
};
