import {GameStateData, OutcomeKey} from "@/types";

const outcomeKeys: OutcomeKey[] = [
    "miracleMarne",
    "logisticsMaster",
    "tacticalGamble",
    "costlyStalemate",
    "parisPoliticalCrisis",
    "germanBreakthrough",
    "ahistoricalCollapse"
];

export function shouldEndGame(state: GameStateData): boolean {
    if (state.ending) return true;
    if (state.timeLeft <= 0) return true;
    if (state.parisThreat >= 100) return true;
    if (state.germanAdvance >= 100) return true;
    if (state.morale <= 0) return true;
    if (state.outcomeScores.ahistoricalCollapse >= 60) return true;
    if (state.outcomeScores.germanBreakthrough >= 70) return true;
    return false;
}

export function resolveEnding(state: GameStateData): OutcomeKey {
    if (state.outcomeScores.ahistoricalCollapse >= 50) {
        return "ahistoricalCollapse";
    }

    if (state.parisThreat >= 95) {
        return state.politicalPressure > 60 || state.cityStability < 35
            ? "parisPoliticalCrisis"
            : "germanBreakthrough";
    }

    if (state.germanAdvance >= 100) {
        return "germanBreakthrough";
    }

    if (state.morale <= 0) {
        return "parisPoliticalCrisis";
    }

    const parisSaved = state.parisThreat < 90 && state.germanAdvance < 95;

    if (state.cityVehiclesUsed && parisSaved) {
        return "miracleMarne";
    }

    if (!state.cityVehiclesUsed && state.railwayCongestion <= 40 && parisSaved) {
        return "logisticsMaster";
    }

    if (state.flankGap > 70 && state.counterattackMomentum > 35 && parisSaved) {
        return "tacticalGamble";
    }

    const best = outcomeKeys.reduce((maxKey, key) => {
        return state.outcomeScores[key] > state.outcomeScores[maxKey] ? key : maxKey;
    }, outcomeKeys[0]);

    return best || "costlyStalemate";
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
