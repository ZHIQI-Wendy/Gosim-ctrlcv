import {
  COMMON_CONFIDENCE_BOUNDS,
  CONTRACT_SEVERITY,
  GOVERNMENT_ACTIONS,
  GOVERNMENT_NUMERIC_BOUNDS,
  GOVERNMENT_VALID_EXAMPLE
} from "@/lib/ai/contracts";

function oneOf(values: readonly string[]): string {
  return values.join(" | ");
}

export const GOVERNMENT_DECISION_PROMPT = `Role: Decide whether a government intervention event should trigger.

JSON shape:
{
  "trigger": boolean,
  "action": string,
  "publicMessage": string,
  "stateDelta": {
    "cityStability": number,
    "politicalPressure": number,
    "commandCohesion": number,
    "governmentCollapseRisk": number,
    "alliedOperationalMomentum": number
  },
  "durationMinutes": number,
  "severity": string,
  "confidence": number,
  "privateRationale": string
}

Enums:
- action = ${oneOf(GOVERNMENT_ACTIONS)}
- severity = ${oneOf(CONTRACT_SEVERITY)}

Bounds:
- stateDelta.cityStability = ${GOVERNMENT_NUMERIC_BOUNDS.cityStability.min}..${GOVERNMENT_NUMERIC_BOUNDS.cityStability.max}
- stateDelta.politicalPressure = ${GOVERNMENT_NUMERIC_BOUNDS.politicalPressure.min}..${GOVERNMENT_NUMERIC_BOUNDS.politicalPressure.max}
- stateDelta.commandCohesion = ${GOVERNMENT_NUMERIC_BOUNDS.commandCohesion.min}..${GOVERNMENT_NUMERIC_BOUNDS.commandCohesion.max}
- stateDelta.governmentCollapseRisk = ${GOVERNMENT_NUMERIC_BOUNDS.governmentCollapseRisk.min}..${GOVERNMENT_NUMERIC_BOUNDS.governmentCollapseRisk.max}
- stateDelta.alliedOperationalMomentum = ${GOVERNMENT_NUMERIC_BOUNDS.alliedOperationalMomentum.min}..${GOVERNMENT_NUMERIC_BOUNDS.alliedOperationalMomentum.max}
- durationMinutes = ${GOVERNMENT_NUMERIC_BOUNDS.durationMinutes.min}..${GOVERNMENT_NUMERIC_BOUNDS.durationMinutes.max}
- confidence = ${COMMON_CONFIDENCE_BOUNDS.min}..${COMMON_CONFIDENCE_BOUNDS.max}

Rules:
- This is not a player order.
- No sub-strategy output.
- publicMessage must not expose hidden state.
- Keep deltas pragmatic and bounded.
- Judge intervention against activeOrders and recentOrders, not as an isolated tick.

Forbidden:
- No command parser outputs.
- No extra strategy keys.
- No markdown.

Valid example:
${JSON.stringify(GOVERNMENT_VALID_EXAMPLE, null, 2)}`;
