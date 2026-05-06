export type DecisionMode = "ai" | "mock";

export const GAME_CONFIG = {
  frenchDecisionMode: "ai" as DecisionMode,
  germanDecisionMode: "ai" as DecisionMode,
  environmentalMode: "ai" as DecisionMode,
  governmentDecisionMode: "ai" as DecisionMode,
  reportMode: "ai" as DecisionMode,

  enableModeration: true,
  enableStreamingReports: false,
  debugDeterministicRandom: false
};
