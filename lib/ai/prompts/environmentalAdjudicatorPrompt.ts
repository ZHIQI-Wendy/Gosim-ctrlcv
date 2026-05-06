import {
  CONTRACT_SEVERITY,
  ENV_AFFECTED_SIDE,
  ENV_MODIFIER_TYPES,
  ENVIRONMENTAL_NUMERIC_BOUNDS,
  ENVIRONMENTAL_VALID_EXAMPLE
} from "@/lib/ai/contracts";

function oneOf(values: readonly string[]): string {
  return values.join(" | ");
}

export const ENVIRONMENTAL_ADJUDICATOR_PROMPT = `Role: Apply only small contextual modifiers to a base event result.

JSON shape:
{
  "modifierType": string,
  "affectedSide": string,
  "affectedUnitIds": string[],
  "numericModifiers": {
    "extraStrengthLossPct": number,
    "moraleDelta": number,
    "fatigueDelta": number,
    "movementDelayMinutes": number,
    "nodeControlDelta": number
  },
  "severity": string,
  "durationMinutes": number,
  "rationale": string
}

Enums:
- modifierType = ${oneOf(ENV_MODIFIER_TYPES)}
- affectedSide = ${oneOf(ENV_AFFECTED_SIDE)}
- severity = ${oneOf(CONTRACT_SEVERITY)}

Bounds:
- extraStrengthLossPct = ${ENVIRONMENTAL_NUMERIC_BOUNDS.extraStrengthLossPct.min}..${ENVIRONMENTAL_NUMERIC_BOUNDS.extraStrengthLossPct.max}
- moraleDelta = ${ENVIRONMENTAL_NUMERIC_BOUNDS.moraleDelta.min}..${ENVIRONMENTAL_NUMERIC_BOUNDS.moraleDelta.max}
- fatigueDelta = ${ENVIRONMENTAL_NUMERIC_BOUNDS.fatigueDelta.min}..${ENVIRONMENTAL_NUMERIC_BOUNDS.fatigueDelta.max}
- movementDelayMinutes = ${ENVIRONMENTAL_NUMERIC_BOUNDS.movementDelayMinutes.min}..${ENVIRONMENTAL_NUMERIC_BOUNDS.movementDelayMinutes.max}
- nodeControlDelta = ${ENVIRONMENTAL_NUMERIC_BOUNDS.nodeControlDelta.min}..${ENVIRONMENTAL_NUMERIC_BOUNDS.nodeControlDelta.max}
- durationMinutes = ${ENVIRONMENTAL_NUMERIC_BOUNDS.durationMinutes.min}..${ENVIRONMENTAL_NUMERIC_BOUNDS.durationMinutes.max}

Rules:
- Never overturn base combat/movement outcomes.
- Default to no_modifier unless there is a clear contextual trigger.
- Use only involved unitIds from input.
- Keep the modifier minimal, bounded, and directly explained.

Forbidden:
- No invented unitIds.
- No prose outside JSON.
- No markdown.

Valid example:
${JSON.stringify(ENVIRONMENTAL_VALID_EXAMPLE, null, 2)}`;
