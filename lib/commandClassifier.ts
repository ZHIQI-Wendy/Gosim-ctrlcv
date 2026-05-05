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
                effects: {parisThreat: -12, morale: 3, fatigue: 2, supply: -2}
            };
        case "DELAY":
            return {
                report: "Rear-guard maneuvers trade space for time and slow German pace.",
                effects: {germanAdvance: -8, fatigue: 3, morale: -2}
            };
        case "COUNTERATTACK":
            return {
                report: "Local counterattack launched to exploit exposed German right flank.",
                effects: {
                    germanAdvance: -15,
                    morale: 8,
                    flankGap: -20,
                    counterattackMomentum: 20,
                    scores: {tacticalGamble: 20}
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
                effects: {flankGap: 10}
            };
        case "OPTIMIZE_RAIL":
            return {
                report: "Rail timetables are tightened to reduce transfer delays.",
                effects: {
                    railwayCongestion: -15,
                    redeployEfficiency: 20,
                    scores: {logisticsMaster: 10}
                }
            };
        case "PROPAGANDA":
            return {
                report: "Civil messaging campaign stabilizes morale and urban confidence.",
                effects: {morale: 5, cityStability: 5}
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
                    morale: -5,
                    commandCohesion: -10,
                    germanAdvance: 4,
                    politicalPressure: 8,
                    scores: {ahistoricalCollapse: 12}
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
