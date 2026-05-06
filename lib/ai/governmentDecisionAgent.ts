import { requestTaskJson } from "@/lib/ai/aiClient";
import { GOVERNMENT_DECISION_PROMPT } from "@/lib/ai/prompts/governmentDecisionPrompt";
import { GovernmentDecisionInput, GovernmentDecisionOutput } from "@/types";

export async function governmentDecisionAI(
  input: GovernmentDecisionInput
): Promise<GovernmentDecisionOutput> {
  return requestTaskJson<GovernmentDecisionOutput>(GOVERNMENT_DECISION_PROMPT, input);
}
