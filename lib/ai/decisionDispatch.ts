import { GAME_CONFIG } from "@/lib/config/gameConfig";
import { environmentalAdjudicatorAI } from "@/lib/ai/environmentalAdjudicator";
import { environmentalAdjudicatorMock } from "@/lib/ai/environmentalAdjudicatorMock";
import { frenchCommandParserAI } from "@/lib/ai/frenchCommandParser";
import { frenchCommandParserMock } from "@/lib/ai/frenchCommandParserMock";
import { germanCommanderAI } from "@/lib/ai/germanCommanderAgent";
import { germanCommanderMock } from "@/lib/ai/germanCommanderMock";
import { governmentDecisionAI } from "@/lib/ai/governmentDecisionAgent";
import { governmentDecisionMock } from "@/lib/ai/governmentDecisionMock";
import { reportGeneratorAI } from "@/lib/ai/reportGenerator";
import { reportGeneratorMock } from "@/lib/ai/reportGeneratorMock";
import {
  ContractValidationResult,
  validateEnvironmentalAdjudicatorContract,
  validateFrenchCommandParserContract,
  validateGermanCommanderContract,
  validateGovernmentDecisionContract,
  validateReportGeneratorContract
} from "@/lib/ai/contracts";
import {
  EnvironmentalAdjudicatorInput,
  EnvironmentalAdjudicatorOutput,
  FrenchCommandParserInput,
  FrenchCommandParserOutput,
  GermanAgentInput,
  GermanAgentOutput,
  GovernmentDecisionInput,
  GovernmentDecisionOutput,
  ReportGeneratorInput,
  ReportGeneratorOutput
} from "@/types";

export type DecisionResult<T> = {
  output: T;
  usedFallback: boolean;
  error?: string;
};

type ContractValidator<T> = (value: unknown) => ContractValidationResult<T>;

function asErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validateOrThrow<T>(subsystem: string, value: unknown, validator: ContractValidator<T>): T {
  const checked = validator(value);
  if (!checked.ok) {
    throw new Error(`[AI][${subsystem}] contract validation failed: ${checked.errors.join("; ")}`);
  }
  return checked.value;
}

function safeMock<T>(subsystem: string, mockOutput: T, validator: ContractValidator<T>): T {
  const checked = validator(mockOutput);
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
  validator: ContractValidator<T>
): Promise<DecisionResult<T>> {
  try {
    const rawOutput = await primary();
    const output = validateOrThrow(subsystem, rawOutput, validator);
    return { output, usedFallback: false };
  } catch (error) {
    console.error(`[AI][${subsystem}] request/validation failed; fallback to mock.`, error);
    const fallbackOutput = safeMock(subsystem, fallback(), validator);
    return {
      output: fallbackOutput,
      usedFallback: true,
      error: asErrorMessage(error)
    };
  }
}

export async function getFrenchCommandDecision(
  input: FrenchCommandParserInput
): Promise<DecisionResult<FrenchCommandParserOutput>> {
  const subsystem = "FrenchCommandParser";
  if (GAME_CONFIG.frenchDecisionMode === "mock") {
    return {
      output: safeMock(subsystem, frenchCommandParserMock(input), validateFrenchCommandParserContract),
      usedFallback: false
    };
  }
  return withFallback(
    subsystem,
    () => frenchCommandParserAI(input),
    () => frenchCommandParserMock(input),
    validateFrenchCommandParserContract
  );
}

export async function getGermanCommanderDecision(
  input: GermanAgentInput
): Promise<DecisionResult<GermanAgentOutput>> {
  const subsystem = "GermanCommander";
  if (GAME_CONFIG.germanDecisionMode === "mock") {
    return {
      output: safeMock(subsystem, germanCommanderMock(input), validateGermanCommanderContract),
      usedFallback: false
    };
  }
  return withFallback(
    subsystem,
    () => germanCommanderAI(input),
    () => germanCommanderMock(input),
    validateGermanCommanderContract
  );
}

export async function getEnvironmentalDecision(
  input: EnvironmentalAdjudicatorInput
): Promise<DecisionResult<EnvironmentalAdjudicatorOutput>> {
  const subsystem = "EnvironmentalAdjudicator";
  if (GAME_CONFIG.environmentalMode === "mock") {
    return {
      output: safeMock(subsystem, environmentalAdjudicatorMock(input), validateEnvironmentalAdjudicatorContract),
      usedFallback: false
    };
  }
  return withFallback(
    subsystem,
    () => environmentalAdjudicatorAI(input),
    () => environmentalAdjudicatorMock(input),
    validateEnvironmentalAdjudicatorContract
  );
}

export async function getGovernmentDecision(
  input: GovernmentDecisionInput
): Promise<DecisionResult<GovernmentDecisionOutput>> {
  const subsystem = "GovernmentDecision";
  if (GAME_CONFIG.governmentDecisionMode === "mock") {
    return {
      output: safeMock(subsystem, governmentDecisionMock(input), validateGovernmentDecisionContract),
      usedFallback: false
    };
  }
  return withFallback(
    subsystem,
    () => governmentDecisionAI(input),
    () => governmentDecisionMock(input),
    validateGovernmentDecisionContract
  );
}

export async function getReportDecision(
  input: ReportGeneratorInput
): Promise<DecisionResult<ReportGeneratorOutput>> {
  const subsystem = "ReportGenerator";
  if (GAME_CONFIG.reportMode === "mock") {
    return {
      output: safeMock(subsystem, reportGeneratorMock(input), validateReportGeneratorContract),
      usedFallback: false
    };
  }
  return withFallback(
    subsystem,
    () => reportGeneratorAI(input),
    () => reportGeneratorMock(input),
    validateReportGeneratorContract
  );
}
