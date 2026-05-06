import { requestTaskJson } from "@/lib/ai/aiClient";
import { DirectorInput, DirectorOutput } from "@/types";

const DIRECTOR_PROMPT = `You are the Director agent for a deterministic operational wargame.
Return JSON only.
Apply bounded theater-level and local friction consequences.
Do not replace deterministic movement, combat, threat, or ending logic.
Use only the provided schema.
Do not return governmentDecision/environmentalDecision wrapper objects.
Return the flat DirectorOutput object with:
trigger, action, publicMessage, stateDelta, unitDelta, nodeDelta, severity, confidence, privateRationale, sourceGameTimeMinutes, sourceStateVersion.`;

export function directorAI(input: DirectorInput): Promise<DirectorOutput> {
  return requestTaskJson<DirectorOutput>(DIRECTOR_PROMPT, input);
}
