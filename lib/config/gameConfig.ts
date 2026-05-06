export type DecisionMode = "ai" | "mock";
export type AIExecutionMode = "async" | "sync";

function readAIExecutionMode(): AIExecutionMode {
  const value = process.env.NEXT_PUBLIC_AI_EXECUTION_MODE?.toLowerCase();
  return value === "sync" ? "sync" : "async";
}

export const GAME_CONFIG = {
  frenchDecisionMode: "ai" as DecisionMode,
  germanDecisionMode: "ai" as DecisionMode,
  environmentalMode: "ai" as DecisionMode,
  governmentDecisionMode: "ai" as DecisionMode,
  reportMode: "ai" as DecisionMode,
  aiExecutionMode: readAIExecutionMode() as AIExecutionMode,

  enableModeration: true,
  enableStreamingReports: false,
  debugDeterministicRandom: false
};
