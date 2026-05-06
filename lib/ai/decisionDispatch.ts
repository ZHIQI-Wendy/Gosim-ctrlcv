import { GAME_CONFIG } from "@/lib/config/gameConfig";
import { directorAI } from "@/lib/ai/directorAgent";
import { directorMock } from "@/lib/ai/directorMock";
import { frenchCommandParserAI } from "@/lib/ai/frenchCommandParser";
import { frenchCommandParserMock } from "@/lib/ai/frenchCommandParserMock";
import { germanCommanderAI } from "@/lib/ai/germanCommanderAgent";
import { germanCommanderMock } from "@/lib/ai/germanCommanderMock";
import { reportGeneratorAI } from "@/lib/ai/reportGenerator";
import { reportGeneratorMock } from "@/lib/ai/reportGeneratorMock";
import {
  validateDirectorContract,
  validateFrenchCommandParserContract,
  validateGermanCommanderContract,
  validateReportGeneratorContract
} from "@/lib/ai/contracts";
import { requestDemoJson } from "@/lib/demo/demoClient";
import {
  getDemoDirectorDecision,
  getDemoFrenchDecision,
  getDemoGermanDecision,
  getDemoReportDecision,
  isDemoDirectorEnabled
} from "@/lib/demo/demoDirector";
import {
  DirectorInput,
  DirectorOutput,
  FrenchCommandParserInput,
  FrenchCommandParserOutput,
  GermanAgentInput,
  GermanAgentOutput,
  ReportGeneratorInput,
  ReportGeneratorOutput
} from "@/types";

export type DecisionResult<T> = {
  output: T;
  usedFallback: boolean;
  error?: string;
};

type ContractValidator<T> = (value: unknown) => { ok: true; value: T } | { ok: false; errors: string[] };
type SourceMetadata = {
  sourceGameTimeMinutes: number;
  sourceStateVersion: number;
};

function asErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function withSourceMetadata(value: unknown, metadata: SourceMetadata): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  return {
    ...record,
    sourceGameTimeMinutes:
      typeof record.sourceGameTimeMinutes === "number" ? record.sourceGameTimeMinutes : metadata.sourceGameTimeMinutes,
    sourceStateVersion:
      typeof record.sourceStateVersion === "number" ? record.sourceStateVersion : metadata.sourceStateVersion
  };
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeDirectorOutput(value: unknown, metadata: SourceMetadata): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.trigger === "boolean" &&
    typeof record.action === "string" &&
    typeof record.publicMessage === "string"
  ) {
    return withSourceMetadata(record, metadata);
  }

  const governmentDecision =
    typeof record.governmentDecision === "object" && record.governmentDecision !== null
      ? (record.governmentDecision as Record<string, unknown>)
      : null;
  const environmentalDecision =
    typeof record.environmentalDecision === "object" && record.environmentalDecision !== null
      ? (record.environmentalDecision as Record<string, unknown>)
      : null;

  if (!governmentDecision && !environmentalDecision) {
    return withSourceMetadata(record, metadata);
  }

  const trigger =
    asBoolean(governmentDecision?.trigger, false) ||
    (typeof environmentalDecision?.modifierType === "string" &&
      environmentalDecision.modifierType !== "no_modifier");

  const action =
    typeof environmentalDecision?.modifierType === "string" && environmentalDecision.modifierType !== "no_modifier"
      ? "COMBAT_FRICTION"
      : governmentDecision?.action === "EMERGENCY_DIRECTIVE"
      ? "EMERGENCY_DIRECTIVE"
      : "NO_ACTION";

  const stateDelta = governmentDecision?.stateDelta as Record<string, unknown> | undefined;
  const numericModifiers = environmentalDecision?.numericModifiers as Record<string, unknown> | undefined;

  const normalized: Record<string, unknown> & {
    stateDelta: Record<string, number>;
    unitDelta: Array<Record<string, unknown>>;
    nodeDelta: Array<Record<string, unknown>>;
  } = {
    trigger,
    action,
    publicMessage: asString(
      governmentDecision?.publicMessage ?? environmentalDecision?.rationale,
      "Director observed no significant intervention requirement."
    ),
    stateDelta: {
      cityStability: asNumber(stateDelta?.cityStability, 0),
      politicalPressure: asNumber(stateDelta?.politicalPressure, 0),
      commandCohesion: asNumber(stateDelta?.commandCohesion, 0),
      governmentCollapseRisk: asNumber(stateDelta?.governmentCollapseRisk, 0),
      alliedOperationalMomentum: asNumber(stateDelta?.alliedOperationalMomentum, 0),
      germanOperationalMomentum: 0,
      railwayCongestion: asNumber(numericModifiers?.movementDelayMinutes, 0) > 0 ? 2 : 0,
      shortTermRedeployDelayMinutes: asNumber(numericModifiers?.movementDelayMinutes, 0)
    },
    unitDelta: [],
    nodeDelta: [],
    severity:
      environmentalDecision?.severity === "major" || governmentDecision?.severity === "major"
        ? "major"
        : environmentalDecision?.severity === "medium" || governmentDecision?.severity === "medium"
        ? "medium"
        : "minor",
    confidence: asNumber(governmentDecision?.confidence ?? 0.6, 0.6),
    privateRationale: asString(
      governmentDecision?.privateRationale ?? environmentalDecision?.rationale,
      "Director normalized a legacy bundled response."
    )
  };

  if (typeof environmentalDecision?.rationale === "string" && environmentalDecision.rationale.trim()) {
    const affectedUnitIds = Array.isArray(environmentalDecision.affectedUnitIds)
      ? environmentalDecision.affectedUnitIds.filter((item): item is string => typeof item === "string")
      : [];
    normalized.unitDelta = affectedUnitIds.slice(0, 8).map((unitId) => ({
      unitId,
      strengthDeltaPct: asNumber(numericModifiers?.extraStrengthLossPct, 0),
      moraleDelta: asNumber(numericModifiers?.moraleDelta, 0),
      fatigueDelta: asNumber(numericModifiers?.fatigueDelta, 0),
      supplyDelta: 0,
      cohesionDelta: 0,
      readinessDelta: 0
    }));
  }

  return withSourceMetadata(normalized, metadata);
}

function validateOrThrow<T>(
  subsystem: string,
  value: unknown,
  validator: ContractValidator<T>,
  metadata: SourceMetadata
): T {
  const normalizedValue = subsystem === "Director" ? normalizeDirectorOutput(value, metadata) : withSourceMetadata(value, metadata);
  const checked = validator(normalizedValue);
  if (!checked.ok) {
    throw new Error(`[AI][${subsystem}] contract validation failed: ${checked.errors.join("; ")}`);
  }
  return checked.value;
}

function safeMock<T>(subsystem: string, mockOutput: T, validator: ContractValidator<T>, metadata: SourceMetadata): T {
  const normalizedValue =
    subsystem === "Director" ? normalizeDirectorOutput(mockOutput, metadata) : withSourceMetadata(mockOutput, metadata);
  const checked = validator(normalizedValue);
  if (!checked.ok) {
    console.error(`[AI][${subsystem}] mock output failed contract validation: ${checked.errors.join("; ")}`);
    return mockOutput;
  }
  return checked.value;
}

async function withFallback<T>(
  subsystem: string,
  primary: () => Promise<unknown>,
  fallback: () => T,
  validator: ContractValidator<T>,
  metadata: SourceMetadata
): Promise<DecisionResult<T>> {
  try {
    const rawOutput = await primary();
    return { output: validateOrThrow(subsystem, rawOutput, validator, metadata), usedFallback: false };
  } catch (error) {
    console.error(`[AI][${subsystem}] request/validation failed; fallback to mock.`, error);
    return {
      output: safeMock(subsystem, fallback(), validator, metadata),
      usedFallback: true,
      error: asErrorMessage(error)
    };
  }
}

export async function getFrenchCommandDecision(
  input: FrenchCommandParserInput
): Promise<DecisionResult<FrenchCommandParserOutput>> {
  const subsystem = "FrenchCommandParser";
  const metadata = {
    sourceGameTimeMinutes: input.visibleState.currentTimeMinutes,
    sourceStateVersion: input.sourceStateVersion
  };
  if (isDemoDirectorEnabled()) {
    return {
      output: safeMock(
        subsystem,
        await requestDemoJson<FrenchCommandParserOutput>("/api/demo/french-command", input),
        validateFrenchCommandParserContract,
        metadata
      ),
      usedFallback: false
    };
  }
  if (GAME_CONFIG.frenchDecisionMode === "mock") {
    return {
      output: safeMock(subsystem, frenchCommandParserMock(input), validateFrenchCommandParserContract, metadata),
      usedFallback: false
    };
  }
  return withFallback(
    subsystem,
    () => frenchCommandParserAI(input),
    () => frenchCommandParserMock(input),
    validateFrenchCommandParserContract,
    metadata
  );
}

export async function getGermanCommanderDecision(
  input: GermanAgentInput
): Promise<DecisionResult<GermanAgentOutput>> {
  const subsystem = "GermanCommander";
  const metadata = {
    sourceGameTimeMinutes: input.currentTimeMinutes,
    sourceStateVersion: input.sourceStateVersion
  };
  if (isDemoDirectorEnabled()) {
    return {
      output: safeMock(
        subsystem,
        await requestDemoJson<GermanAgentOutput>("/api/demo/german-command", input),
        validateGermanCommanderContract,
        metadata
      ),
      usedFallback: false
    };
  }
  if (GAME_CONFIG.germanDecisionMode === "mock") {
    return {
      output: safeMock(subsystem, germanCommanderMock(input), validateGermanCommanderContract, metadata),
      usedFallback: false
    };
  }
  return withFallback(
    subsystem,
    () => germanCommanderAI(input),
    () => germanCommanderMock(input),
    validateGermanCommanderContract,
    metadata
  );
}

export async function getDirectorDecision(input: DirectorInput): Promise<DecisionResult<DirectorOutput>> {
  const subsystem = "Director";
  const metadata = {
    sourceGameTimeMinutes: input.currentTimeMinutes,
    sourceStateVersion: input.sourceStateVersion
  };
  if (isDemoDirectorEnabled()) {
    return {
      output: safeMock(
        subsystem,
        (await requestDemoJson<DirectorOutput>("/api/demo/director", input)) ?? getDemoDirectorDecision(input) ?? directorMock(input),
        validateDirectorContract,
        metadata
      ),
      usedFallback: false
    };
  }
  if (GAME_CONFIG.governmentDecisionMode === "mock" || GAME_CONFIG.environmentalMode === "mock") {
    return {
      output: safeMock(subsystem, directorMock(input), validateDirectorContract, metadata),
      usedFallback: false
    };
  }
  return withFallback(subsystem, () => directorAI(input), () => directorMock(input), validateDirectorContract, metadata);
}

export async function getReportDecision(
  input: ReportGeneratorInput
): Promise<DecisionResult<ReportGeneratorOutput>> {
  const subsystem = "Reporter";
  const metadata = {
    sourceGameTimeMinutes: input.currentTimeMinutes,
    sourceStateVersion: input.sourceStateVersion
  };
  if (isDemoDirectorEnabled()) {
    return {
      output: safeMock(
        subsystem,
        await requestDemoJson<ReportGeneratorOutput>("/api/demo/report-generator", input),
        validateReportGeneratorContract,
        metadata
      ),
      usedFallback: false
    };
  }
  if (GAME_CONFIG.reportMode === "mock") {
    return {
      output: safeMock(subsystem, reportGeneratorMock(input), validateReportGeneratorContract, metadata),
      usedFallback: false
    };
  }
  return withFallback(
    subsystem,
    () => reportGeneratorAI(input),
    () => reportGeneratorMock(input),
    validateReportGeneratorContract,
    metadata
  );
}

export {
  getDemoDirectorDecision,
  getDemoFrenchDecision,
  getDemoGermanDecision,
  getDemoReportDecision
};
