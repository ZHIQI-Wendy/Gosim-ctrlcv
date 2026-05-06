import { requestTaskJson } from "@/lib/ai/aiClient";
import { ENVIRONMENTAL_ADJUDICATOR_PROMPT } from "@/lib/ai/prompts/environmentalAdjudicatorPrompt";
import { EnvironmentalAdjudicatorInput, EnvironmentalAdjudicatorOutput } from "@/types";

export async function environmentalAdjudicatorAI(
  input: EnvironmentalAdjudicatorInput
): Promise<EnvironmentalAdjudicatorOutput> {
  return requestTaskJson<EnvironmentalAdjudicatorOutput>(ENVIRONMENTAL_ADJUDICATOR_PROMPT, input);
}
