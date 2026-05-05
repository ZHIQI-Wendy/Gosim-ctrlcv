export type AllowedAction =
    | "DEFEND"
    | "DELAY"
    | "COUNTERATTACK"
    | "REDEPLOY"
    | "RECON"
    | "OPTIMIZE_RAIL"
    | "PROPAGANDA"
    | "GOVERNMENT_DECISION"
    | "MOBILIZE_CITY"
    | "INVALID_TO_CHAOS";

export type HistoricalValidity = "high" | "medium" | "low";

export type StrategicFocus =
    | "DEFEND_PARIS"
    | "DELAY_GERMANS"
    | "COUNTER_STRIKE"
    | "OPTIMIZE_RAILWAYS"
    | "BOOST_RECON"
    | "STABILIZE_CITY";

export type OutcomeKey =
    | "miracleMarne"
    | "logisticsMaster"
    | "tacticalGamble"
    | "costlyStalemate"
    | "parisPoliticalCrisis"
    | "germanBreakthrough"
    | "ahistoricalCollapse";

export type CityId = "paris" | "marne" | "verdun" | "reims";

export interface OutcomeScores {
    miracleMarne: number;
    logisticsMaster: number;
    tacticalGamble: number;
    costlyStalemate: number;
    parisPoliticalCrisis: number;
    germanBreakthrough: number;
    ahistoricalCollapse: number;
}

export interface GameStateData {
    timeLeft: number;
    parisThreat: number;
    germanAdvance: number;
    flankGap: number;
    morale: number;
    fatigue: number;
    supply: number;
    railwayCongestion: number;
    cityStability: number;
    cityVehiclesDiscovered: boolean;
    cityVehiclesUsed: boolean;
    politicalPressure: number;
    commandCohesion: number;
    counterattackMomentum: number;
    outcomeScores: OutcomeScores;
    ending: OutcomeKey | null;
}

export interface CommandEffects {
    parisThreat?: number;
    germanAdvance?: number;
    flankGap?: number;
    morale?: number;
    fatigue?: number;
    supply?: number;
    railwayCongestion?: number;
    cityStability?: number;
    politicalPressure?: number;
    commandCohesion?: number;
    counterattackMomentum?: number;
    scores?: Partial<OutcomeScores>;
}

export interface ClassifiedCommand {
    action: AllowedAction;
    historicalValidity: HistoricalValidity;
    report: string;
    effects: CommandEffects;
    sourceText: string;
    focus: StrategicFocus;
}

export interface OrderItem {
    id: string;
    createdAt: number;
    command: ClassifiedCommand;
}

export interface BattleReport {
    id: string;
    tick: number;
    title: string;
    body: string;
    dateLabel?: string;
}

export interface KnowledgeCard {
    id: string;
    key: string;
    title: string;
    body: string;
}

export interface AgentLine {
    id: string;
    speaker: "Adviser" | "Friendly HQ" | "German HQ";
    text: string;
}

export interface TickArtifacts {
    reports: BattleReport[];
    cards: KnowledgeCard[];
    agentLines: AgentLine[];
}

export interface TickResult {
    nextState: GameStateData;
    consumedOrders: string[];
    artifacts: TickArtifacts;
}
