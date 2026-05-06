import { AllowedAction, FrenchCommandParserInput, FrenchCommandParserOutput } from "@/types";

function inferAction(raw: string, discovered: boolean): AllowedAction {
  const text = raw.toLowerCase();
  if (/taxi|vehicle|paris transport|city vehicle/.test(text)) {
    return discovered ? "MOBILIZE_CITY" : "RECON";
  }
  if (/defend|hold|fortify/.test(text)) return "DEFEND";
  if (/delay|slow|buy time|stall/.test(text)) return "DELAY";
  if (/counterattack|attack flank|counter strike|strike/.test(text)) return "COUNTERATTACK";
  if (/move|send|redeploy|transfer/.test(text)) return "REDEPLOY";
  if (/recon|scout|observe|intel/.test(text)) return "RECON";
  if (/rail|train|logistics/.test(text)) return "OPTIMIZE_RAIL";
  if (/propaganda|morale|public/.test(text)) return "PROPAGANDA";
  if (/diplomacy|ceasefire|surrender|nuclear|teleport|magic/.test(text)) return "INVALID_TO_CHAOS";
  return "DEFEND";
}

export function frenchCommandParserMock(
  input: FrenchCommandParserInput
): FrenchCommandParserOutput {
  const action = inferAction(input.rawText, input.visibleState.cityVehiclesDiscovered);

  return {
    action,
    targetNodeId: input.selectedNodeId ?? null,
    unitId: input.selectedUnitId ?? null,
    urgency: action === "COUNTERATTACK" ? "high" : "medium",
    riskTolerance: action === "COUNTERATTACK" ? "high" : "medium",
    constraints: {
      avoidHeavyLosses: action !== "COUNTERATTACK",
      preserveParis: true,
      preserveReserves: action !== "MOBILIZE_CITY",
      prioritizeSpeed: action === "REDEPLOY" || action === "MOBILIZE_CITY"
    },
    historicalValidity: action === "INVALID_TO_CHAOS" ? "impossible" : "high",
    ambiguity: input.rawText.trim().length < 10 ? "medium" : "low",
    mappedOrderText: input.rawText.trim().slice(0, 120) || "No text",
    explanation: `Mapped to ${action} by mock parser.`,
    sourceGameTimeMinutes: input.visibleState.currentTimeMinutes,
    sourceStateVersion: 1
  };
}
