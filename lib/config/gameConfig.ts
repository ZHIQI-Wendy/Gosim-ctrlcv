export type DecisionMode = "ai" | "mock";
export type AIExecutionMode = "async" | "sync";
export type PendingEffectAgent = "french" | "german" | "director" | "reporter";

function readAIExecutionMode(): AIExecutionMode {
  const value = process.env.NEXT_PUBLIC_AI_EXECUTION_MODE?.toLowerCase();
  return value === "sync" ? "sync" : "async";
}

function readEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

function readEnvFloat(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

function readPendingEffectAgents(): PendingEffectAgent[] {
  const raw = process.env.NEXT_PUBLIC_PENDING_EFFECT_AGENTS;
  if (!raw) {
    return [];
  }

  const allowed = new Set<PendingEffectAgent>(["french", "german", "director", "reporter"]);
  const parsed = raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is PendingEffectAgent => allowed.has(value as PendingEffectAgent));

  return parsed.length > 0 ? parsed : ["french", "german", "director", "reporter"];
}

export const GAME_CONFIG = {
  // AI decision modes
  frenchDecisionMode: "ai" as DecisionMode,
  germanDecisionMode: "ai" as DecisionMode,
  environmentalMode: "ai" as DecisionMode,
  governmentDecisionMode: "ai" as DecisionMode,
  reportMode: "ai" as DecisionMode,
  aiExecutionMode: readAIExecutionMode() as AIExecutionMode,

  // Feature flags
  enableModeration: true,
  enableStreamingReports: false,
  debugDeterministicRandom: false,
  pendingEffectAgents: readPendingEffectAgents(),

  // === GAME TIMING (in game minutes) ===
  simStepGameMinutes: readEnvNumber("NEXT_PUBLIC_SIM_STEP_GAME_MINUTES", 10),
  decisionStepGameMinutes: readEnvNumber("NEXT_PUBLIC_DECISION_STEP_GAME_MINUTES", 60),
  combatStepGameMinutes: readEnvNumber("NEXT_PUBLIC_COMBAT_STEP_GAME_MINUTES", 60),
  reportMinIntervalGameMinutes: readEnvNumber("NEXT_PUBLIC_REPORT_MIN_INTERVAL_GAME_MINUTES", 120),

  // === AGENT CYCLES (in game minutes) ===
  directorCycleMinutes: readEnvNumber("NEXT_PUBLIC_DIRECTOR_CYCLE_MINUTES", 60),
  germanCycleMinutes: readEnvNumber("NEXT_PUBLIC_GERMAN_CYCLE_MINUTES", 60),
  frenchCycleMinutes: readEnvNumber("NEXT_PUBLIC_FRENCH_CYCLE_MINUTES", 30),

  // === TRANSMISSION EFFICIENCY (0-100) ===
  transmissionEffCriticalThreshold: readEnvNumber("NEXT_PUBLIC_TRANSMISSION_EFF_CRITICAL_THRESHOLD", 40),
  transmissionEffDegradedThreshold: readEnvNumber("NEXT_PUBLIC_TRANSMISSION_EFF_DEGRADED_THRESHOLD", 60),
  transmissionEffOptimalThreshold: readEnvNumber("NEXT_PUBLIC_TRANSMISSION_EFF_OPTIMAL_THRESHOLD", 80),

  // === DIRECTOR (Government Decision) TRIGGERS ===
  governmentDecisionParisThreatThreshold: readEnvNumber(
    "NEXT_PUBLIC_GOVERNMENT_DECISION_PARIS_THREAT_THRESHOLD",
    75
  ),
  governmentDecisionPoliticalPressureThreshold: readEnvNumber(
    "NEXT_PUBLIC_GOVERNMENT_DECISION_POLITICAL_PRESSURE_THRESHOLD",
    75
  ),
  governmentDecisionCityStabilityMin: readEnvNumber("NEXT_PUBLIC_GOVERNMENT_DECISION_CITY_STABILITY_MIN", 45),
  governmentDecisionCollapseRiskThreshold: readEnvNumber(
    "NEXT_PUBLIC_GOVERNMENT_DECISION_COLLAPSE_RISK_THRESHOLD",
    65
  ),
  governmentDecisionInvalidCommandsThreshold: readEnvNumber(
    "NEXT_PUBLIC_GOVERNMENT_DECISION_INVALID_COMMANDS_THRESHOLD",
    2
  ),

  // === TRANSMISSION DELAY (in game minutes) ===
  frenchOrderTransmissionDelayBase: readEnvNumber("NEXT_PUBLIC_FRENCH_ORDER_TRANSMISSION_DELAY_BASE", 5),
  frenchOrderTransmissionDelayMax: readEnvNumber("NEXT_PUBLIC_FRENCH_ORDER_TRANSMISSION_DELAY_MAX", 30),

  // === STALE RESULT HANDLING (in game minutes) ===
  agentDecisionStalenessTreshold: readEnvNumber("NEXT_PUBLIC_AGENT_DECISION_STALENESS_THRESHOLD", 120)
} as const;
