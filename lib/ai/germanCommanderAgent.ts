import { requestTaskJson } from "@/lib/ai/aiClient";
import { GERMAN_COMMANDER_PROMPT } from "@/lib/ai/prompts/germanCommanderPrompt";
import { GermanAgentInput, GermanAgentOutput } from "@/types";

export async function germanCommanderAI(input: GermanAgentInput): Promise<GermanAgentOutput> {
  return requestTaskJson<GermanAgentOutput>(GERMAN_COMMANDER_PROMPT, input);
}
