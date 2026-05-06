# AI Output Contracts

This document defines the exact JSON output contracts expected from each AI subsystem.
Runtime contract checks live in `lib/ai/contracts.ts`.

## French Command Parser

### Output JSON shape

```json
{
  "action": "DEFEND|DELAY|COUNTERATTACK|REDEPLOY|RECON|OPTIMIZE_RAIL|PROPAGANDA|MOBILIZE_CITY|INVALID_TO_CHAOS",
  "targetNodeId": "string|null",
  "unitId": "string|null",
  "urgency": "low|medium|high",
  "riskTolerance": "low|medium|high",
  "constraints": {
    "avoidHeavyLosses": true,
    "preserveParis": true,
    "preserveReserves": true,
    "prioritizeSpeed": false
  },
  "historicalValidity": "high|medium|low|impossible",
  "ambiguity": "none|low|medium|high",
  "mappedOrderText": "string",
  "explanation": "string"
}
```

### Allowed enum values

- `action`: `DEFEND`, `DELAY`, `COUNTERATTACK`, `REDEPLOY`, `RECON`, `OPTIMIZE_RAIL`, `PROPAGANDA`, `MOBILIZE_CITY`, `INVALID_TO_CHAOS`
- `urgency`: `low`, `medium`, `high`
- `riskTolerance`: `low`, `medium`, `high`
- `historicalValidity`: `high`, `medium`, `low`, `impossible`
- `ambiguity`: `none`, `low`, `medium`, `high`

### Valid example

```json
{
  "action": "REDEPLOY",
  "targetNodeId": "meaux",
  "unitId": "sixth_army",
  "urgency": "medium",
  "riskTolerance": "medium",
  "constraints": {
    "avoidHeavyLosses": true,
    "preserveParis": true,
    "preserveReserves": true,
    "prioritizeSpeed": true
  },
  "historicalValidity": "high",
  "ambiguity": "low",
  "mappedOrderText": "Redeploy reserve toward Meaux to reinforce the approach.",
  "explanation": "Clear movement order with explicit destination and unit."
}
```

### Invalid example

```json
{
  "action": "GOVERNMENT_DECISION",
  "targetNodeId": "made_up_city",
  "unitId": null
}
```

Why invalid:
- `action` is not in allowed parser actions.
- `targetNodeId` is invented and must come from input context IDs.
- Required keys are missing.

## German Commander

### Output JSON shape

```json
{
  "action": "ADVANCE|ATTACK|PROBE|HOLD|REDEPLOY|CONSOLIDATE",
  "targetNodeId": "string|null",
  "unitIds": ["string"],
  "stance": "aggressive|balanced|cautious",
  "intensity": "low|medium|high",
  "expectedEffect": {
    "targetPressure": 0,
    "supplyRisk": 0,
    "flankRisk": 0
  },
  "confidence": 0.0,
  "rationale": "string"
}
```

### Allowed enum values

- `action`: `ADVANCE`, `ATTACK`, `PROBE`, `HOLD`, `REDEPLOY`, `CONSOLIDATE`
- `stance`: `aggressive`, `balanced`, `cautious`
- `intensity`: `low`, `medium`, `high`

### Bounds

- `confidence`: `0..1`

### Valid example

```json
{
  "action": "ATTACK",
  "targetNodeId": "meaux",
  "unitIds": ["german_first_army", "german_second_army"],
  "stance": "aggressive",
  "intensity": "high",
  "expectedEffect": {
    "targetPressure": 12,
    "supplyRisk": 7,
    "flankRisk": 5
  },
  "confidence": 0.67,
  "rationale": "Local pressure is favorable and momentum supports concentrated action."
}
```

### Invalid example

```json
{
  "action": "FLANK_TELEPORT",
  "targetNodeId": "paris",
  "unitIds": ["unknown_unit"],
  "confidence": 1.5
}
```

Why invalid:
- Unknown `action`.
- `unitIds` contains unknown ID.
- `confidence` out of range.
- Missing required keys.

## Environmental Adjudicator

### Output JSON shape

```json
{
  "modifierType": "extra_loss|reduced_loss|morale_shift|movement_delay|control_bonus|no_modifier",
  "affectedSide": "allied|german|both|none",
  "affectedUnitIds": ["string"],
  "numericModifiers": {
    "extraStrengthLossPct": 0.0,
    "moraleDelta": 0,
    "fatigueDelta": 0,
    "movementDelayMinutes": 0,
    "nodeControlDelta": 0
  },
  "severity": "minor|medium|major",
  "durationMinutes": 0,
  "rationale": "string"
}
```

### Allowed enum values

- `modifierType`: `extra_loss`, `reduced_loss`, `morale_shift`, `movement_delay`, `control_bonus`, `no_modifier`
- `affectedSide`: `allied`, `german`, `both`, `none`
- `severity`: `minor`, `medium`, `major`

### Bounds

- `numericModifiers.extraStrengthLossPct`: `-0.03..0.03`
- `numericModifiers.moraleDelta`: `-5..5`
- `numericModifiers.fatigueDelta`: `-5..6`
- `numericModifiers.movementDelayMinutes`: `0..60`
- `numericModifiers.nodeControlDelta`: `-10..10`
- `durationMinutes`: `0..180`

### Valid example

```json
{
  "modifierType": "morale_shift",
  "affectedSide": "both",
  "affectedUnitIds": ["fifth_army", "german_first_army"],
  "numericModifiers": {
    "extraStrengthLossPct": 0,
    "moraleDelta": -2,
    "fatigueDelta": 2,
    "movementDelayMinutes": 10,
    "nodeControlDelta": 0
  },
  "severity": "medium",
  "durationMinutes": 30,
  "rationale": "Weather and congestion reduced operational coherence for both sides."
}
```

### Invalid example

```json
{
  "modifierType": "extra_loss",
  "affectedSide": "both",
  "affectedUnitIds": ["fifth_army"],
  "numericModifiers": {
    "extraStrengthLossPct": 0.25
  },
  "durationMinutes": 900
}
```

Why invalid:
- Modifier values exceed bounds.
- Missing required numeric modifier fields.
- Missing `severity` and `rationale`.

## Government Decision

### Output JSON shape

```json
{
  "trigger": true,
  "action": "NO_ACTION|EMERGENCY_DIRECTIVE",
  "publicMessage": "string",
  "stateDelta": {
    "cityStability": 0,
    "politicalPressure": 0,
    "commandCohesion": 0,
    "governmentCollapseRisk": 0,
    "alliedOperationalMomentum": 0
  },
  "durationMinutes": 0,
  "severity": "minor|medium|major",
  "confidence": 0.0,
  "privateRationale": "string"
}
```

### Allowed enum values

- `action`: `NO_ACTION`, `EMERGENCY_DIRECTIVE`
- `severity`: `minor`, `medium`, `major`

### Bounds

- `stateDelta.cityStability`: `-12..12`
- `stateDelta.politicalPressure`: `-12..12`
- `stateDelta.commandCohesion`: `-6..6`
- `stateDelta.governmentCollapseRisk`: `-20..20`
- `stateDelta.alliedOperationalMomentum`: `-8..8`
- `durationMinutes`: `0..360`
- `confidence`: `0..1`

### Valid example

```json
{
  "trigger": true,
  "action": "EMERGENCY_DIRECTIVE",
  "publicMessage": "Government issues emergency guidance to preserve order and command focus.",
  "stateDelta": {
    "cityStability": 4,
    "politicalPressure": -5,
    "commandCohesion": 4,
    "governmentCollapseRisk": -6,
    "alliedOperationalMomentum": 2
  },
  "durationMinutes": 120,
  "severity": "medium",
  "confidence": 0.62,
  "privateRationale": "Threat and political pressure crossed intervention threshold."
}
```

### Invalid example

```json
{
  "trigger": true,
  "action": "ORDER_COUNTERATTACK",
  "publicMessage": "Use hidden collapse risk now.",
  "stateDelta": {
    "cityStability": 99
  }
}
```

Why invalid:
- `action` is not in government action enum.
- Missing required delta fields and bounds violated.
- `publicMessage` leaks hidden/internal reasoning.

## Report Generator

### Output JSON shape

```json
{
  "headline": "string",
  "reportText": "string",
  "advisorLine": "string",
  "knowledgeHint": "string (optional)",
  "privateRationale": "string"
}
```

### Allowed enum values

- None (string fields only).

### Bounds

- `headline`: max 90 chars
- `reportText`: max 450 chars
- `advisorLine`: max 220 chars
- `knowledgeHint`: max 220 chars (if present)
- `privateRationale`: max 260 chars

### Valid example

```json
{
  "headline": "Situation: Contested Marne Crossings",
  "reportText": "Heavy exchange near Marne crossings. Paris threat remains elevated but contained.",
  "advisorLine": "Preserve rail flexibility and avoid fragmented redeploy orders.",
  "knowledgeHint": "Crossing sectors magnify fatigue and delay effects under pressure.",
  "privateRationale": "Framed publicly without hidden-state references."
}
```

### Invalid example

```json
{
  "headline": "Internal Formula Dump",
  "reportText": "Threat = 20 + 0.3*x + hiddenState",
  "advisorLine": "Model confidence 0.19 from private chain."
}
```

Why invalid:
- Missing required `privateRationale`.
- Public text exposes formulas/internal AI details and hidden state.
