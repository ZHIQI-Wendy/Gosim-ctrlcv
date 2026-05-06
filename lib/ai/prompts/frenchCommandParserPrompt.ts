import {
  FRENCH_AMBIGUITY,
  FRENCH_COMMAND_ACTIONS,
  FRENCH_COMMAND_RISK,
  FRENCH_COMMAND_URGENCY,
  FRENCH_COMMAND_VALID_EXAMPLE,
  FRENCH_HISTORICAL_VALIDITY
} from "@/lib/ai/contracts";

function oneOf(values: readonly string[]): string {
  return values.join(" | ");
}

export const FRENCH_COMMAND_PARSER_PROMPT = `Role: Parse one player instruction into exactly one French military order.

JSON shape:
{
  "action": string,
  "targetNodeId": string|null,
  "unitId": string|null,
  "urgency": string,
  "riskTolerance": string,
  "constraints": {
    "avoidHeavyLosses": boolean,
    "preserveParis": boolean,
    "preserveReserves": boolean,
    "prioritizeSpeed": boolean
  },
  "historicalValidity": string,
  "ambiguity": string,
  "mappedOrderText": string,
  "explanation": string
}

Enums:
- action = ${oneOf(FRENCH_COMMAND_ACTIONS)}
- urgency = ${oneOf(FRENCH_COMMAND_URGENCY)}
- riskTolerance = ${oneOf(FRENCH_COMMAND_RISK)}
- historicalValidity = ${oneOf(FRENCH_HISTORICAL_VALIDITY)}
- ambiguity = ${oneOf(FRENCH_AMBIGUITY)}

Rules:
- Never output GOVERNMENT_DECISION.
- Output one military order or INVALID_TO_CHAOS.
- selectedNodeId and selectedUnitId are hints only.
- Use only nodeIds from visibleState.knownNodes and unitIds from visibleState.knownUnits.
- Unknown IDs are forbidden.
- MOBILIZE_CITY is allowed only when visibleState.cityVehiclesDiscovered is true.
- Prefer continuity with activeOrders and recentOrders unless the player clearly changes intent.

Forbidden:
- No markdown.
- No prose outside JSON.
- No extra orders or strategy lists.

Valid example:
${JSON.stringify(FRENCH_COMMAND_VALID_EXAMPLE, null, 2)}`;
