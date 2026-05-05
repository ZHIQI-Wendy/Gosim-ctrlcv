import {
    ClassifiedCommand,
    CommandEffects,
    StrategicFocus,
    AllowedAction,
    HistoricalValidity
} from "@/types";

const focusActionMap: Record<StrategicFocus, AllowedAction> = {
    DEFEND_PARIS: "DEFEND",
    DELAY_GERMANS: "DELAY",
    COUNTER_STRIKE: "COUNTERATTACK",
    OPTIMIZE_RAILWAYS: "OPTIMIZE_RAIL",
    BOOST_RECON: "RECON",
    STABILIZE_CITY: "PROPAGANDA"
};

const invalidPatterns = [
    /ceasefire/i,
    /peace\s+talk/i,
    /surrender/i,
    /nuclear/i,
    /teleport/i,
    /magic/i
];

function makeCommand(
    action: AllowedAction,
    focus: StrategicFocus,
    sourceText: string,
    historicalValidity: HistoricalValidity,
    report: string,
    effects: CommandEffects
): ClassifiedCommand {
    return {
        action,
        focus,
        sourceText,
        historicalValidity,
        report,
        effects
    };
}

function actionTemplate(action: AllowedAction): { report: string; effects: CommandEffects } {
    switch (action) {
        case "DEFEND":
            return {
                report: "French units reinforce inner defensive belts around Paris.",
                effects: {parisThreat: -4, germanAdvance: -2, morale: 4, fatigue: 2, supply: -2}
            };
        case "DELAY":
            return {
                report: "Rear-guard maneuvers trade space for time and slow German pace.",
                effects: {germanAdvance: -5, parisThreat: -2, fatigue: 3, morale: 1, commandCohesion: -1}
            };
        case "COUNTERATTACK":
            return {
                report: "Local counterattack launched to exploit exposed German right flank.",
                effects: {
                    germanAdvance: -6,
                    flankGap: 4,
                    morale: 3,
                    fatigue: 5,
                    supply: -3,
                    counterattackMomentum: 15,
                    scores: {tacticalGamble: 8}
                }
            };
        case "REDEPLOY":
            return {
                report: "Forces are redeployed from calm sectors to threatened lines.",
                effects: {parisThreat: -3, railwayCongestion: 5, commandCohesion: -2, fatigue: 2}
            };
        case "RECON":
            return {
                report: "Recon flights and cavalry screens improve visibility of the front.",
                effects: {flankGap: 5, germanAdvance: -1, commandCohesion: 2, supply: -1}
            };
        case "OPTIMIZE_RAIL":
            return {
                report: "Rail timetables are tightened to reduce transfer delays.",
                effects: {
                    railwayCongestion: -10,
                    supply: 3,
                    commandCohesion: 2,
                    scores: {logisticsMaster: 6}
                }
            };
        case "PROPAGANDA":
            return {
                report: "Civil messaging campaign stabilizes morale and urban confidence.",
                effects: {morale: 4, cityStability: 5, politicalPressure: -4, parisThreat: -1}
            };
        case "GOVERNMENT_DECISION":
            return {
                report: "Emergency cabinet order improves chain-of-command discipline.",
                effects: {commandCohesion: 6, politicalPressure: -3, morale: 1}
            };
        case "MOBILIZE_CITY":
            return {
                report: "City vehicle requisition begins under emergency legal authority.",
                effects: {
                    parisThreat: -20,
                    morale: 10,
                    cityStability: -8,
                    scores: {miracleMarne: 20}
                }
            };
        case "INVALID_TO_CHAOS":
            return {
                report:
                    "Government channels tried to explore an unrealistic political shortcut; frontline orders became vague and delayed.",
                effects: {
                    morale: -8,
                    commandCohesion: -10,
                    germanAdvance: 6,
                    politicalPressure: 12,
                    scores: {ahistoricalCollapse: 18}
                }
            };
    }
}

function detectActionFromText(text: string): AllowedAction | null {
    if (/counter|attack|strike|offensive/i.test(text)) {
        return "COUNTERATTACK";
    }
    if (/defend|hold|fortify/i.test(text)) {
        return "DEFEND";
    }
    if (/delay|slow|stall/i.test(text)) {
        return "DELAY";
    }
    if (/rail|train|logistics/i.test(text)) {
        return "OPTIMIZE_RAIL";
    }
    if (/recon|scout|intel/i.test(text)) {
        return "RECON";
    }
    if (/city|civil|morale|stability|public/i.test(text)) {
        return "PROPAGANDA";
    }
    if (/redeploy|shift|transfer|reserve/i.test(text)) {
        return "REDEPLOY";
    }
    return null;
}

export function classifyCommand(focus: StrategicFocus, inputText: string): ClassifiedCommand {
    const cleaned = inputText.trim();
    const requested = cleaned.length > 0 ? detectActionFromText(cleaned) : null;
    const defaultAction = focusActionMap[focus];

    if (invalidPatterns.some((pattern) => pattern.test(cleaned))) {
        const template = actionTemplate("INVALID_TO_CHAOS");
        return makeCommand(
            "INVALID_TO_CHAOS",
            focus,
            cleaned,
            "low",
            template.report,
            template.effects
        );
    }

    const action = requested ?? defaultAction;
    const template = actionTemplate(action);
    const validity: HistoricalValidity = requested ? "high" : "medium";

    return makeCommand(action, focus, cleaned, validity, template.report, template.effects);
}
