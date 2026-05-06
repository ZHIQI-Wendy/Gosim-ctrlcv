import {
  DirectorOutput,
  AllowedAction,
  EnvironmentalAdjudicatorOutput,
  FrenchCommandParserOutput,
  GermanAgentOutput,
  GovernmentDecisionOutput,
  ReportGeneratorOutput
} from "@/types";

export type ContractValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

export type NumericBound = { min: number; max: number };

export type AIOutputContract<T> = {
  subsystem: string;
  requiredFields: string[];
  optionalFields: string[];
  enums: Record<string, readonly string[]>;
  numericBounds: Record<string, NumericBound>;
  validExample: T;
  invalidExample: {
    example: Record<string, unknown>;
    reason: string;
  };
};

export const FRENCH_COMMAND_ACTIONS: readonly AllowedAction[] = [
  "DEFEND",
  "DELAY",
  "COUNTERATTACK",
  "REDEPLOY",
  "RECON",
  "OPTIMIZE_RAIL",
  "PROPAGANDA",
  "MOBILIZE_CITY",
  "INVALID_TO_CHAOS"
] as const;

export const FRENCH_COMMAND_URGENCY = ["low", "medium", "high"] as const;
export const FRENCH_COMMAND_RISK = ["low", "medium", "high"] as const;
export const FRENCH_HISTORICAL_VALIDITY = ["high", "medium", "low", "impossible"] as const;
export const FRENCH_AMBIGUITY = ["none", "low", "medium", "high"] as const;

export const GERMAN_ACTIONS = ["ADVANCE", "ATTACK", "PROBE", "HOLD", "REDEPLOY", "CONSOLIDATE"] as const;
export const GERMAN_STANCE = ["aggressive", "balanced", "cautious"] as const;
export const GERMAN_INTENSITY = ["low", "medium", "high"] as const;

export const ENV_MODIFIER_TYPES = [
  "extra_loss",
  "reduced_loss",
  "morale_shift",
  "movement_delay",
  "control_bonus",
  "no_modifier"
] as const;
export const ENV_AFFECTED_SIDE = ["allied", "german", "both", "none"] as const;
export const CONTRACT_SEVERITY = ["minor", "medium", "major"] as const;

export const GOVERNMENT_ACTIONS = ["NO_ACTION", "EMERGENCY_DIRECTIVE"] as const;
export const DIRECTOR_ACTIONS = [
  "NO_ACTION",
  "EMERGENCY_DIRECTIVE",
  "COMBAT_FRICTION",
  "LOGISTICS_SHOCK",
  "MORALE_SWING",
  "CITY_RESPONSE"
] as const;

export const COMMON_CONFIDENCE_BOUNDS: NumericBound = { min: 0, max: 1 };
export const ENVIRONMENTAL_NUMERIC_BOUNDS = {
  extraStrengthLossPct: { min: -0.03, max: 0.03 },
  moraleDelta: { min: -5, max: 5 },
  fatigueDelta: { min: -5, max: 6 },
  movementDelayMinutes: { min: 0, max: 60 },
  nodeControlDelta: { min: -10, max: 10 },
  durationMinutes: { min: 0, max: 180 },
  confidence: COMMON_CONFIDENCE_BOUNDS
} as const;

export const GOVERNMENT_NUMERIC_BOUNDS = {
  cityStability: { min: -12, max: 12 },
  politicalPressure: { min: -12, max: 12 },
  commandCohesion: { min: -6, max: 6 },
  governmentCollapseRisk: { min: -20, max: 20 },
  alliedOperationalMomentum: { min: -8, max: 8 },
  durationMinutes: { min: 0, max: 360 },
  confidence: COMMON_CONFIDENCE_BOUNDS
} as const;

export const REPORT_TEXT_BOUNDS = {
  headlineMax: 90,
  reportTextMax: 450,
  advisorLineMax: 220,
  knowledgeHintMax: 220,
  privateRationaleMax: 260
} as const;

export const FRENCH_COMMAND_VALID_EXAMPLE: FrenchCommandParserOutput = {
  action: "REDEPLOY",
  targetNodeId: "meaux",
  unitId: "sixth_army",
  urgency: "medium",
  riskTolerance: "medium",
  constraints: {
    avoidHeavyLosses: true,
    preserveParis: true,
    preserveReserves: true,
    prioritizeSpeed: true
  },
  historicalValidity: "high",
  ambiguity: "low",
  mappedOrderText: "Redeploy reserve toward Meaux to reinforce the approach.",
  explanation: "Clear movement order with explicit destination and unit.",
  sourceGameTimeMinutes: 120,
  sourceStateVersion: 1
};

export const GERMAN_COMMANDER_VALID_EXAMPLE: GermanAgentOutput = {
  action: "ATTACK",
  targetNodeId: "meaux",
  unitIds: ["german_first_army", "german_second_army"],
  stance: "aggressive",
  intensity: "high",
  expectedEffect: {
    targetPressure: 12,
    supplyRisk: 7,
    flankRisk: 5
  },
  confidence: 0.67,
  rationale: "Local pressure is favorable and momentum supports concentrated action.",
  sourceGameTimeMinutes: 120,
  sourceStateVersion: 1
};

export const ENVIRONMENTAL_VALID_EXAMPLE: EnvironmentalAdjudicatorOutput = {
  modifierType: "morale_shift",
  affectedSide: "both",
  affectedUnitIds: ["fifth_army", "german_first_army"],
  numericModifiers: {
    extraStrengthLossPct: 0,
    moraleDelta: -2,
    fatigueDelta: 2,
    movementDelayMinutes: 10,
    nodeControlDelta: 0
  },
  severity: "medium",
  durationMinutes: 30,
  rationale: "Weather and congestion reduced operational coherence for both sides.",
  sourceGameTimeMinutes: 120,
  sourceStateVersion: 1
};

export const GOVERNMENT_VALID_EXAMPLE: GovernmentDecisionOutput = {
  trigger: true,
  action: "EMERGENCY_DIRECTIVE",
  publicMessage: "Government issues emergency guidance to preserve order and command focus.",
  stateDelta: {
    cityStability: 4,
    politicalPressure: -5,
    commandCohesion: 4,
    governmentCollapseRisk: -6,
    alliedOperationalMomentum: 2
  },
  durationMinutes: 120,
  severity: "medium",
  confidence: 0.62,
  privateRationale: "Threat and political pressure crossed intervention threshold.",
  sourceGameTimeMinutes: 120,
  sourceStateVersion: 1
};

export const DIRECTOR_VALID_EXAMPLE: DirectorOutput = {
  trigger: true,
  action: "COMBAT_FRICTION",
  publicMessage: "Director applied local friction after a major combat event.",
  stateDelta: {
    cityStability: -1,
    politicalPressure: 2,
    commandCohesion: -1,
    governmentCollapseRisk: 1,
    alliedOperationalMomentum: -1,
    germanOperationalMomentum: 1,
    railwayCongestion: 4,
    shortTermRedeployDelayMinutes: 10
  },
  unitDelta: [],
  nodeDelta: [],
  severity: "medium",
  confidence: 0.64,
  privateRationale: "Director combined political and environmental side effects without replacing deterministic combat resolution.",
  sourceGameTimeMinutes: 120,
  sourceStateVersion: 1
};

export const REPORT_VALID_EXAMPLE: ReportGeneratorOutput = {
  headline: "Situation: Contested Marne Crossings",
  reportText: "Heavy exchange near Marne crossings. Paris threat remains elevated but contained.",
  advisorLine: "Preserve rail flexibility and avoid fragmented redeploy orders.",
  knowledgeHint: "Crossing sectors magnify fatigue and delay effects under pressure.",
  privateRationale: "Framed publicly without hidden-state references.",
  shouldReport: true,
  sourceGameTimeMinutes: 120,
  sourceStateVersion: 1
};

export const AI_OUTPUT_CONTRACTS: {
  frenchCommandParser: AIOutputContract<FrenchCommandParserOutput>;
  germanCommander: AIOutputContract<GermanAgentOutput>;
  director: AIOutputContract<DirectorOutput>;
  environmentalAdjudicator: AIOutputContract<EnvironmentalAdjudicatorOutput>;
  governmentDecision: AIOutputContract<GovernmentDecisionOutput>;
  reportGenerator: AIOutputContract<ReportGeneratorOutput>;
} = {
  frenchCommandParser: {
    subsystem: "French Command Parser",
    requiredFields: [
      "action",
      "targetNodeId",
      "unitId",
      "urgency",
      "riskTolerance",
      "constraints",
      "historicalValidity",
      "ambiguity",
      "mappedOrderText",
      "explanation",
      "sourceGameTimeMinutes",
      "sourceStateVersion"
    ],
    optionalFields: [],
    enums: {
      action: FRENCH_COMMAND_ACTIONS,
      urgency: FRENCH_COMMAND_URGENCY,
      riskTolerance: FRENCH_COMMAND_RISK,
      historicalValidity: FRENCH_HISTORICAL_VALIDITY,
      ambiguity: FRENCH_AMBIGUITY
    },
    numericBounds: {},
    validExample: FRENCH_COMMAND_VALID_EXAMPLE,
    invalidExample: {
      example: {
        action: "GOVERNMENT_DECISION",
        targetNodeId: "made_up_city",
        unitId: null
      },
      reason: "Unknown action and invented nodeId are forbidden."
    }
  },
  germanCommander: {
    subsystem: "German Commander",
    requiredFields: [
      "action",
      "targetNodeId",
      "unitIds",
      "stance",
      "intensity",
      "expectedEffect",
      "confidence",
      "rationale",
      "sourceGameTimeMinutes",
      "sourceStateVersion"
    ],
    optionalFields: [],
    enums: {
      action: GERMAN_ACTIONS,
      stance: GERMAN_STANCE,
      intensity: GERMAN_INTENSITY
    },
    numericBounds: {
      confidence: COMMON_CONFIDENCE_BOUNDS
    },
    validExample: GERMAN_COMMANDER_VALID_EXAMPLE,
    invalidExample: {
      example: {
        action: "FLANK_TELEPORT",
        targetNodeId: "paris",
        unitIds: ["unknown_unit"],
        confidence: 1.5
      },
      reason: "Action enum, unknown unitId, and confidence bounds are invalid."
    }
  },
  director: {
    subsystem: "Director",
    requiredFields: [
      "trigger",
      "action",
      "publicMessage",
      "stateDelta",
      "unitDelta",
      "nodeDelta",
      "severity",
      "confidence",
      "privateRationale",
      "sourceGameTimeMinutes",
      "sourceStateVersion"
    ],
    optionalFields: [],
    enums: {
      action: DIRECTOR_ACTIONS,
      severity: CONTRACT_SEVERITY
    },
    numericBounds: {
      confidence: COMMON_CONFIDENCE_BOUNDS
    },
    validExample: DIRECTOR_VALID_EXAMPLE,
    invalidExample: {
      example: {
        action: "REPLACE_COMBAT_SYSTEM",
        confidence: 2
      },
      reason: "Director cannot replace deterministic systems or exceed confidence bounds."
    }
  },
  environmentalAdjudicator: {
    subsystem: "Environmental Adjudicator",
    requiredFields: [
      "modifierType",
      "affectedSide",
      "affectedUnitIds",
      "numericModifiers",
      "severity",
      "durationMinutes",
      "rationale",
      "sourceGameTimeMinutes",
      "sourceStateVersion"
    ],
    optionalFields: [],
    enums: {
      modifierType: ENV_MODIFIER_TYPES,
      affectedSide: ENV_AFFECTED_SIDE,
      severity: CONTRACT_SEVERITY
    },
    numericBounds: {
      "numericModifiers.extraStrengthLossPct": ENVIRONMENTAL_NUMERIC_BOUNDS.extraStrengthLossPct,
      "numericModifiers.moraleDelta": ENVIRONMENTAL_NUMERIC_BOUNDS.moraleDelta,
      "numericModifiers.fatigueDelta": ENVIRONMENTAL_NUMERIC_BOUNDS.fatigueDelta,
      "numericModifiers.movementDelayMinutes": ENVIRONMENTAL_NUMERIC_BOUNDS.movementDelayMinutes,
      "numericModifiers.nodeControlDelta": ENVIRONMENTAL_NUMERIC_BOUNDS.nodeControlDelta,
      durationMinutes: ENVIRONMENTAL_NUMERIC_BOUNDS.durationMinutes
    },
    validExample: ENVIRONMENTAL_VALID_EXAMPLE,
    invalidExample: {
      example: {
        modifierType: "extra_loss",
        affectedSide: "both",
        affectedUnitIds: ["fifth_army"],
        numericModifiers: { extraStrengthLossPct: 0.25 },
        durationMinutes: 900
      },
      reason: "Modifier magnitude and duration exceed contract bounds."
    }
  },
  governmentDecision: {
    subsystem: "Government Decision",
    requiredFields: [
      "trigger",
      "action",
      "publicMessage",
      "stateDelta",
      "durationMinutes",
      "severity",
      "confidence",
      "privateRationale"
    ],
    optionalFields: [],
    enums: {
      action: GOVERNMENT_ACTIONS,
      severity: CONTRACT_SEVERITY
    },
    numericBounds: {
      "stateDelta.cityStability": GOVERNMENT_NUMERIC_BOUNDS.cityStability,
      "stateDelta.politicalPressure": GOVERNMENT_NUMERIC_BOUNDS.politicalPressure,
      "stateDelta.commandCohesion": GOVERNMENT_NUMERIC_BOUNDS.commandCohesion,
      "stateDelta.governmentCollapseRisk": GOVERNMENT_NUMERIC_BOUNDS.governmentCollapseRisk,
      "stateDelta.alliedOperationalMomentum": GOVERNMENT_NUMERIC_BOUNDS.alliedOperationalMomentum,
      durationMinutes: GOVERNMENT_NUMERIC_BOUNDS.durationMinutes,
      confidence: GOVERNMENT_NUMERIC_BOUNDS.confidence
    },
    validExample: GOVERNMENT_VALID_EXAMPLE,
    invalidExample: {
      example: {
        trigger: true,
        action: "ORDER_COUNTERATTACK",
        publicMessage: "Use hidden collapse risk now.",
        stateDelta: { cityStability: 99 }
      },
      reason: "Government output must not be player orders and cannot expose hidden state."
    }
  },
  reportGenerator: {
    subsystem: "Report Generator",
    requiredFields: [
      "headline",
      "reportText",
      "advisorLine",
      "privateRationale",
      "shouldReport",
      "sourceGameTimeMinutes",
      "sourceStateVersion"
    ],
    optionalFields: ["knowledgeHint"],
    enums: {},
    numericBounds: {},
    validExample: REPORT_VALID_EXAMPLE,
    invalidExample: {
      example: {
        headline: "Internal Formula Dump",
        reportText: "Threat = 20 + 0.3*x + hiddenState",
        advisorLine: "Model confidence 0.19 from private chain."
      },
      reason: "Public text must not reveal formulas, hidden state, or AI internals."
    }
  }
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function hasEnumValue(
  field: string,
  value: unknown,
  allowed: readonly string[],
  errors: string[]
): void {
  if (typeof value !== "string" || !allowed.includes(value)) {
    errors.push(`${field} must be one of: ${allowed.join(", ")}`);
  }
}

function hasNumberInRange(
  field: string,
  value: unknown,
  min: number,
  max: number,
  errors: string[]
): void {
  if (typeof value !== "number" || Number.isNaN(value) || value < min || value > max) {
    errors.push(`${field} must be a number in [${min}, ${max}]`);
  }
}

function hasString(field: string, value: unknown, errors: string[]): void {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${field} must be a non-empty string`);
  }
}

function hasBoolean(field: string, value: unknown, errors: string[]): void {
  if (typeof value !== "boolean") {
    errors.push(`${field} must be boolean`);
  }
}

function hasNullableString(field: string, value: unknown, errors: string[]): void {
  if (!(value === null || typeof value === "string")) {
    errors.push(`${field} must be string or null`);
  }
}

function hasSourceMetadata(value: unknown, errors: string[]): void {
  if (typeof (value as any)?.sourceGameTimeMinutes !== "number") {
    errors.push("sourceGameTimeMinutes must be a non-negative number");
  }
  if (typeof (value as any)?.sourceStateVersion !== "number") {
    errors.push("sourceStateVersion must be a non-negative number");
  }
}

function okOrError<T>(errors: string[], value: unknown): ContractValidationResult<T> {
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: value as T };
}

export function validateFrenchCommandParserContract(
  value: unknown
): ContractValidationResult<FrenchCommandParserOutput> {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["Output must be an object"] };

  hasEnumValue("action", value.action, FRENCH_COMMAND_ACTIONS, errors);
  hasNullableString("targetNodeId", value.targetNodeId, errors);
  hasNullableString("unitId", value.unitId, errors);
  hasEnumValue("urgency", value.urgency, FRENCH_COMMAND_URGENCY, errors);
  hasEnumValue("riskTolerance", value.riskTolerance, FRENCH_COMMAND_RISK, errors);
  hasEnumValue("historicalValidity", value.historicalValidity, FRENCH_HISTORICAL_VALIDITY, errors);
  hasEnumValue("ambiguity", value.ambiguity, FRENCH_AMBIGUITY, errors);
  hasString("mappedOrderText", value.mappedOrderText, errors);
  hasString("explanation", value.explanation, errors);

  if (!isRecord(value.constraints)) {
    errors.push("constraints must be an object");
  } else {
    hasBoolean("constraints.avoidHeavyLosses", value.constraints.avoidHeavyLosses, errors);
    hasBoolean("constraints.preserveParis", value.constraints.preserveParis, errors);
    hasBoolean("constraints.preserveReserves", value.constraints.preserveReserves, errors);
    hasBoolean("constraints.prioritizeSpeed", value.constraints.prioritizeSpeed, errors);
  }

  hasSourceMetadata(value, errors);
  return okOrError<FrenchCommandParserOutput>(errors, value);
}

export function validateDirectorContract(
  value: unknown
): ContractValidationResult<DirectorOutput> {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["Output must be an object"] };

  hasBoolean("trigger", value.trigger, errors);
  hasEnumValue("action", value.action, DIRECTOR_ACTIONS, errors);
  hasString("publicMessage", value.publicMessage, errors);
  hasEnumValue("severity", value.severity, CONTRACT_SEVERITY, errors);
  hasNumberInRange("confidence", value.confidence, 0, 1, errors);
  hasString("privateRationale", value.privateRationale, errors);
  hasSourceMetadata(value, errors);

  return okOrError<DirectorOutput>(errors, value);
}

export function validateGermanCommanderContract(
  value: unknown
): ContractValidationResult<GermanAgentOutput> {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["Output must be an object"] };

  hasEnumValue("action", value.action, GERMAN_ACTIONS, errors);
  hasNullableString("targetNodeId", value.targetNodeId, errors);
  if (!isStringArray(value.unitIds)) errors.push("unitIds must be a string array");
  hasEnumValue("stance", value.stance, GERMAN_STANCE, errors);
  hasEnumValue("intensity", value.intensity, GERMAN_INTENSITY, errors);
  hasNumberInRange("confidence", value.confidence, COMMON_CONFIDENCE_BOUNDS.min, COMMON_CONFIDENCE_BOUNDS.max, errors);
  hasString("rationale", value.rationale, errors);

  if (!isRecord(value.expectedEffect)) {
    errors.push("expectedEffect must be an object");
  } else {
    if (typeof value.expectedEffect.targetPressure !== "number") errors.push("expectedEffect.targetPressure must be number");
    if (typeof value.expectedEffect.supplyRisk !== "number") errors.push("expectedEffect.supplyRisk must be number");
    if (typeof value.expectedEffect.flankRisk !== "number") errors.push("expectedEffect.flankRisk must be number");
  }

  hasSourceMetadata(value, errors);
  return okOrError<GermanAgentOutput>(errors, value);
}

export function validateEnvironmentalAdjudicatorContract(
  value: unknown
): ContractValidationResult<EnvironmentalAdjudicatorOutput> {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["Output must be an object"] };

  hasEnumValue("modifierType", value.modifierType, ENV_MODIFIER_TYPES, errors);
  hasEnumValue("affectedSide", value.affectedSide, ENV_AFFECTED_SIDE, errors);
  if (!isStringArray(value.affectedUnitIds)) errors.push("affectedUnitIds must be a string array");
  hasEnumValue("severity", value.severity, CONTRACT_SEVERITY, errors);
  hasString("rationale", value.rationale, errors);
  hasNumberInRange(
    "durationMinutes",
    value.durationMinutes,
    ENVIRONMENTAL_NUMERIC_BOUNDS.durationMinutes.min,
    ENVIRONMENTAL_NUMERIC_BOUNDS.durationMinutes.max,
    errors
  );

  if (!isRecord(value.numericModifiers)) {
    errors.push("numericModifiers must be an object");
  } else {
    hasNumberInRange(
      "numericModifiers.extraStrengthLossPct",
      value.numericModifiers.extraStrengthLossPct,
      ENVIRONMENTAL_NUMERIC_BOUNDS.extraStrengthLossPct.min,
      ENVIRONMENTAL_NUMERIC_BOUNDS.extraStrengthLossPct.max,
      errors
    );
    hasNumberInRange(
      "numericModifiers.moraleDelta",
      value.numericModifiers.moraleDelta,
      ENVIRONMENTAL_NUMERIC_BOUNDS.moraleDelta.min,
      ENVIRONMENTAL_NUMERIC_BOUNDS.moraleDelta.max,
      errors
    );
    hasNumberInRange(
      "numericModifiers.fatigueDelta",
      value.numericModifiers.fatigueDelta,
      ENVIRONMENTAL_NUMERIC_BOUNDS.fatigueDelta.min,
      ENVIRONMENTAL_NUMERIC_BOUNDS.fatigueDelta.max,
      errors
    );
    hasNumberInRange(
      "numericModifiers.movementDelayMinutes",
      value.numericModifiers.movementDelayMinutes,
      ENVIRONMENTAL_NUMERIC_BOUNDS.movementDelayMinutes.min,
      ENVIRONMENTAL_NUMERIC_BOUNDS.movementDelayMinutes.max,
      errors
    );
    hasNumberInRange(
      "numericModifiers.nodeControlDelta",
      value.numericModifiers.nodeControlDelta,
      ENVIRONMENTAL_NUMERIC_BOUNDS.nodeControlDelta.min,
      ENVIRONMENTAL_NUMERIC_BOUNDS.nodeControlDelta.max,
      errors
    );
  }

  hasSourceMetadata(value, errors);
  return okOrError<EnvironmentalAdjudicatorOutput>(errors, value);
}

export function validateGovernmentDecisionContract(
  value: unknown
): ContractValidationResult<GovernmentDecisionOutput> {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["Output must be an object"] };

  hasBoolean("trigger", value.trigger, errors);
  hasEnumValue("action", value.action, GOVERNMENT_ACTIONS, errors);
  hasString("publicMessage", value.publicMessage, errors);
  hasEnumValue("severity", value.severity, CONTRACT_SEVERITY, errors);
  hasNumberInRange(
    "durationMinutes",
    value.durationMinutes,
    GOVERNMENT_NUMERIC_BOUNDS.durationMinutes.min,
    GOVERNMENT_NUMERIC_BOUNDS.durationMinutes.max,
    errors
  );
  hasNumberInRange(
    "confidence",
    value.confidence,
    GOVERNMENT_NUMERIC_BOUNDS.confidence.min,
    GOVERNMENT_NUMERIC_BOUNDS.confidence.max,
    errors
  );
  hasString("privateRationale", value.privateRationale, errors);

  if (!isRecord(value.stateDelta)) {
    errors.push("stateDelta must be an object");
  } else {
    hasNumberInRange(
      "stateDelta.cityStability",
      value.stateDelta.cityStability,
      GOVERNMENT_NUMERIC_BOUNDS.cityStability.min,
      GOVERNMENT_NUMERIC_BOUNDS.cityStability.max,
      errors
    );
    hasNumberInRange(
      "stateDelta.politicalPressure",
      value.stateDelta.politicalPressure,
      GOVERNMENT_NUMERIC_BOUNDS.politicalPressure.min,
      GOVERNMENT_NUMERIC_BOUNDS.politicalPressure.max,
      errors
    );
    hasNumberInRange(
      "stateDelta.commandCohesion",
      value.stateDelta.commandCohesion,
      GOVERNMENT_NUMERIC_BOUNDS.commandCohesion.min,
      GOVERNMENT_NUMERIC_BOUNDS.commandCohesion.max,
      errors
    );
    hasNumberInRange(
      "stateDelta.governmentCollapseRisk",
      value.stateDelta.governmentCollapseRisk,
      GOVERNMENT_NUMERIC_BOUNDS.governmentCollapseRisk.min,
      GOVERNMENT_NUMERIC_BOUNDS.governmentCollapseRisk.max,
      errors
    );
    hasNumberInRange(
      "stateDelta.alliedOperationalMomentum",
      value.stateDelta.alliedOperationalMomentum,
      GOVERNMENT_NUMERIC_BOUNDS.alliedOperationalMomentum.min,
      GOVERNMENT_NUMERIC_BOUNDS.alliedOperationalMomentum.max,
      errors
    );
  }

  hasSourceMetadata(value, errors);
  return okOrError<GovernmentDecisionOutput>(errors, value);
}

export function validateReportGeneratorContract(
  value: unknown
): ContractValidationResult<ReportGeneratorOutput> {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["Output must be an object"] };

  hasString("headline", value.headline, errors);
  hasString("reportText", value.reportText, errors);
  hasString("advisorLine", value.advisorLine, errors);
  hasString("privateRationale", value.privateRationale, errors);
  hasBoolean("shouldReport", value.shouldReport, errors);

  if (value.knowledgeHint !== undefined && typeof value.knowledgeHint !== "string") {
    errors.push("knowledgeHint must be string when provided");
  }

  hasSourceMetadata(value, errors);
  return okOrError<ReportGeneratorOutput>(errors, value);
}
