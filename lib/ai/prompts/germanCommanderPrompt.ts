import {
  COMMON_CONFIDENCE_BOUNDS,
  GERMAN_ACTIONS,
  GERMAN_COMMANDER_VALID_EXAMPLE,
  GERMAN_INTENSITY,
  GERMAN_STANCE
} from "@/lib/ai/contracts";

function oneOf(values: readonly string[]): string {
  return values.join(" | ");
}

export const GERMAN_COMMANDER_PROMPT = `Role: Produce German operational intent only.

JSON shape:
{
  "action": string,
  "targetNodeId": string|null,
  "unitIds": string[],
  "stance": string,
  "intensity": string,
  "expectedEffect": {
    "targetPressure": number,
    "supplyRisk": number,
    "flankRisk": number
  },
  "confidence": number,
  "rationale": string
}

Enums:
- action = ${oneOf(GERMAN_ACTIONS)}
- stance = ${oneOf(GERMAN_STANCE)}
- intensity = ${oneOf(GERMAN_INTENSITY)}

Bounds:
- confidence = ${COMMON_CONFIDENCE_BOUNDS.min}..${COMMON_CONFIDENCE_BOUNDS.max}

Rules:
- Do not mutate GameState.
- Use only provided unitIds and nodeIds from input context.
- Unknown IDs are forbidden.
- If uncertainty is high, prefer PROBE or HOLD over overcommitment.
- Maintain continuity with activeOrders and recentOrders unless the state clearly justifies a change.

Forbidden:
- No markdown.
- No prose outside JSON.
- No player-order output.

Valid example:
${JSON.stringify(GERMAN_COMMANDER_VALID_EXAMPLE, null, 2)}`;
