import {
  DirectorOutput,
  AllowedAction,
  EnvironmentalAdjudicatorOutput,
  FrenchCommandParserOutput,
  GameState,
  GermanAgentOutput,
  GovernmentDecisionOutput,
  MapNodeId,
  ReportGeneratorOutput,
  Unit
} from "@/types";
import {
  ENVIRONMENTAL_NUMERIC_BOUNDS,
  FRENCH_COMMAND_ACTIONS,
  GOVERNMENT_NUMERIC_BOUNDS,
  REPORT_TEXT_BOUNDS
} from "@/lib/ai/contracts";
import { clamp } from "@/lib/utils";

const NODE_IDS: MapNodeId[] = [
  "paris",
  "paris_rail_hub",
  "ourcq_line",
  "meaux",
  "marne_crossings",
  "coulommiers",
  "montmirail",
  "senlis",
  "aisne_road",
  "soissons",
  "chateau_thierry",
  "reims",
  "epernay",
  "chalons",
  "verdun",
  "bar_le_duc",
  "sezanne",
  "fere_champenoise"
];

const ACTIONS: AllowedAction[] = [...FRENCH_COMMAND_ACTIONS];

export function isMapNodeId(value: unknown): value is MapNodeId {
  return typeof value === "string" && (NODE_IDS as string[]).includes(value);
}

export function isAllowedAction(value: unknown): value is AllowedAction {
  return typeof value === "string" && (ACTIONS as string[]).includes(value);
}

export function getNodeIds(state: GameState): Set<MapNodeId> {
  return new Set(state.nodes.map((node) => node.id));
}

export function getUnitIds(state: GameState): Set<string> {
  return new Set(state.units.map((unit) => unit.id));
}

export function validateNodeId(state: GameState, nodeId?: MapNodeId | null): MapNodeId | undefined {
  if (!nodeId) return undefined;
  return getNodeIds(state).has(nodeId) ? nodeId : undefined;
}

export function validateUnitId(state: GameState, unitId?: string | null): string | undefined {
  if (!unitId) return undefined;
  return getUnitIds(state).has(unitId) ? unitId : undefined;
}

export function clampUnitStats(unit: Unit): Unit {
  return {
    ...unit,
    strength: Math.max(0, unit.strength),
    morale: clamp(unit.morale),
    fatigue: clamp(unit.fatigue),
    supply: clamp(unit.supply),
    cohesion: clamp(unit.cohesion),
    readiness: clamp(unit.readiness),
    entrenchment: clamp(unit.entrenchment),
    momentum: clamp(unit.momentum),
    travelProgress: unit.travelProgress === undefined ? undefined : clamp(unit.travelProgress, 0, 1)
  };
}

export function clampState(state: GameState): GameState {
  return {
    ...state,
    commandCohesion: clamp(state.commandCohesion),
    cityStability: clamp(state.cityStability),
    politicalPressure: clamp(state.politicalPressure),
    railwayCongestion: clamp(state.railwayCongestion),
    railCapacity: clamp(state.railCapacity, 50, 130),
    shortTermRedeployDelayMinutes: Math.max(0, state.shortTermRedeployDelayMinutes),
    intelligenceLevel: clamp(state.intelligenceLevel),
    flankGap: clamp(state.flankGap),
    observedFlankGap: clamp(state.observedFlankGap),
    germanOperationalMomentum: clamp(state.germanOperationalMomentum),
    alliedOperationalMomentum: clamp(state.alliedOperationalMomentum),
    germanSupplyPressure: clamp(state.germanSupplyPressure),
    germanCommandCohesion: clamp(state.germanCommandCohesion),
    parisThreat: clamp(state.parisThreat),
    threatAbove95Minutes: Math.max(0, state.threatAbove95Minutes),
    parisContestedMinutes: Math.max(0, state.parisContestedMinutes),
    governmentCollapseRisk: clamp(state.governmentCollapseRisk),
    invalidCommandsInLast6Hours: Math.max(0, state.invalidCommandsInLast6Hours),
    outcomeScores: {
      miracleMarne: clamp(state.outcomeScores.miracleMarne),
      logisticsMaster: clamp(state.outcomeScores.logisticsMaster),
      tacticalGamble: clamp(state.outcomeScores.tacticalGamble),
      ahistoricalCollapse: clamp(state.outcomeScores.ahistoricalCollapse)
    },
    units: state.units.map(clampUnitStats)
  };
}

export function validateFrenchParserOutput(
  state: GameState,
  output: FrenchCommandParserOutput
): FrenchCommandParserOutput {
  const action = isAllowedAction(output.action) ? output.action : "INVALID_TO_CHAOS";
  const targetNodeId = validateNodeId(state, output.targetNodeId);
  const unitId = validateUnitId(state, output.unitId);

  if (action === "MOBILIZE_CITY" && (!state.cityVehiclesDiscovered || !state.cityVehiclesAvailable)) {
    return { ...output, action: "RECON", targetNodeId: targetNodeId ?? null, unitId: unitId ?? null };
  }

  return {
    ...output,
    action,
    targetNodeId: targetNodeId ?? null,
    unitId: unitId ?? null
  };
}

export function validateGermanOutput(state: GameState, output: GermanAgentOutput): GermanAgentOutput {
  const germanIds = new Set(state.units.filter((unit) => unit.side === "german").map((unit) => unit.id));
  const validUnitIds = output.unitIds.filter((unitId) => germanIds.has(unitId));
  const targetNodeId = validateNodeId(state, output.targetNodeId) ?? null;

  return {
    ...output,
    unitIds: validUnitIds,
    targetNodeId,
    confidence: clamp(output.confidence, 0, 1)
  };
}

export function validateGovernmentDecision(output: GovernmentDecisionOutput): GovernmentDecisionOutput {
  return {
    ...output,
    stateDelta: {
      cityStability: clamp(
        output.stateDelta.cityStability,
        GOVERNMENT_NUMERIC_BOUNDS.cityStability.min,
        GOVERNMENT_NUMERIC_BOUNDS.cityStability.max
      ),
      politicalPressure: clamp(
        output.stateDelta.politicalPressure,
        GOVERNMENT_NUMERIC_BOUNDS.politicalPressure.min,
        GOVERNMENT_NUMERIC_BOUNDS.politicalPressure.max
      ),
      commandCohesion: clamp(
        output.stateDelta.commandCohesion,
        GOVERNMENT_NUMERIC_BOUNDS.commandCohesion.min,
        GOVERNMENT_NUMERIC_BOUNDS.commandCohesion.max
      ),
      governmentCollapseRisk: clamp(
        output.stateDelta.governmentCollapseRisk,
        GOVERNMENT_NUMERIC_BOUNDS.governmentCollapseRisk.min,
        GOVERNMENT_NUMERIC_BOUNDS.governmentCollapseRisk.max
      ),
      alliedOperationalMomentum: clamp(
        output.stateDelta.alliedOperationalMomentum,
        GOVERNMENT_NUMERIC_BOUNDS.alliedOperationalMomentum.min,
        GOVERNMENT_NUMERIC_BOUNDS.alliedOperationalMomentum.max
      )
    },
    durationMinutes: clamp(
      output.durationMinutes,
      GOVERNMENT_NUMERIC_BOUNDS.durationMinutes.min,
      GOVERNMENT_NUMERIC_BOUNDS.durationMinutes.max
    ),
    confidence: clamp(
      output.confidence,
      GOVERNMENT_NUMERIC_BOUNDS.confidence.min,
      GOVERNMENT_NUMERIC_BOUNDS.confidence.max
    ),
    privateRationale: String(output.privateRationale ?? "Government intervention rationale unavailable.").slice(
      0,
      REPORT_TEXT_BOUNDS.privateRationaleMax
    )
  };
}

export function validateDirectorOutput(output: DirectorOutput): DirectorOutput {
  return {
    ...output,
    stateDelta: {
      cityStability: clamp(output.stateDelta.cityStability, -12, 12),
      politicalPressure: clamp(output.stateDelta.politicalPressure, -12, 12),
      commandCohesion: clamp(output.stateDelta.commandCohesion, -6, 6),
      governmentCollapseRisk: clamp(output.stateDelta.governmentCollapseRisk, -20, 20),
      alliedOperationalMomentum: clamp(output.stateDelta.alliedOperationalMomentum, -8, 8),
      germanOperationalMomentum: clamp(output.stateDelta.germanOperationalMomentum, -8, 8),
      railwayCongestion: clamp(output.stateDelta.railwayCongestion, -12, 12),
      shortTermRedeployDelayMinutes: clamp(output.stateDelta.shortTermRedeployDelayMinutes, 0, 60)
    },
    unitDelta: (output.unitDelta ?? []).slice(0, 8).map((delta) => ({
      unitId: String(delta.unitId),
      strengthDeltaPct: clamp(delta.strengthDeltaPct, -0.03, 0.03),
      moraleDelta: clamp(delta.moraleDelta, -5, 5),
      fatigueDelta: clamp(delta.fatigueDelta, -5, 6),
      supplyDelta: clamp(delta.supplyDelta, -5, 5),
      cohesionDelta: clamp(delta.cohesionDelta, -5, 5),
      readinessDelta: clamp(delta.readinessDelta, -5, 5)
    })),
    nodeDelta: (output.nodeDelta ?? []).slice(0, 4).map((delta) => ({
      nodeId: delta.nodeId,
      controlPressureDelta: clamp(delta.controlPressureDelta, -10, 10),
      defenseValueDelta: clamp(delta.defenseValueDelta, -2, 2),
      supplyValueDelta: clamp(delta.supplyValueDelta, -2, 2),
      transportValueDelta: clamp(delta.transportValueDelta, -2, 2)
    })),
    confidence: clamp(output.confidence, 0, 1),
    privateRationale: String(output.privateRationale ?? "Director rationale unavailable.").slice(
      0,
      REPORT_TEXT_BOUNDS.privateRationaleMax
    )
  };
}

export function validateEnvironmentalOutput(
  output: EnvironmentalAdjudicatorOutput
): EnvironmentalAdjudicatorOutput {
  return {
    ...output,
    numericModifiers: {
      extraStrengthLossPct: clamp(
        output.numericModifiers.extraStrengthLossPct,
        ENVIRONMENTAL_NUMERIC_BOUNDS.extraStrengthLossPct.min,
        ENVIRONMENTAL_NUMERIC_BOUNDS.extraStrengthLossPct.max
      ),
      moraleDelta: clamp(
        output.numericModifiers.moraleDelta,
        ENVIRONMENTAL_NUMERIC_BOUNDS.moraleDelta.min,
        ENVIRONMENTAL_NUMERIC_BOUNDS.moraleDelta.max
      ),
      fatigueDelta: clamp(
        output.numericModifiers.fatigueDelta,
        ENVIRONMENTAL_NUMERIC_BOUNDS.fatigueDelta.min,
        ENVIRONMENTAL_NUMERIC_BOUNDS.fatigueDelta.max
      ),
      movementDelayMinutes: clamp(
        output.numericModifiers.movementDelayMinutes,
        ENVIRONMENTAL_NUMERIC_BOUNDS.movementDelayMinutes.min,
        ENVIRONMENTAL_NUMERIC_BOUNDS.movementDelayMinutes.max
      ),
      nodeControlDelta: clamp(
        output.numericModifiers.nodeControlDelta,
        ENVIRONMENTAL_NUMERIC_BOUNDS.nodeControlDelta.min,
        ENVIRONMENTAL_NUMERIC_BOUNDS.nodeControlDelta.max
      )
    },
    durationMinutes: clamp(
      output.durationMinutes,
      ENVIRONMENTAL_NUMERIC_BOUNDS.durationMinutes.min,
      ENVIRONMENTAL_NUMERIC_BOUNDS.durationMinutes.max
    )
  };
}

export function validateReportOutput(output: ReportGeneratorOutput): ReportGeneratorOutput {
  return {
    ...output,
    headline: String(output.headline ?? "Situation Update").slice(0, REPORT_TEXT_BOUNDS.headlineMax),
    reportText: String(output.reportText ?? "No new public report.").slice(0, REPORT_TEXT_BOUNDS.reportTextMax),
    advisorLine: String(output.advisorLine ?? "Continue deliberate coordination.").slice(0, REPORT_TEXT_BOUNDS.advisorLineMax),
    knowledgeHint: output.knowledgeHint
      ? String(output.knowledgeHint).slice(0, REPORT_TEXT_BOUNDS.knowledgeHintMax)
      : undefined,
    privateRationale: String(output.privateRationale ?? "No internal rationale provided.").slice(
      0,
      REPORT_TEXT_BOUNDS.privateRationaleMax
    ),
    shouldReport: Boolean(output.shouldReport),
    sourceGameTimeMinutes: Number.isFinite(output.sourceGameTimeMinutes) ? output.sourceGameTimeMinutes : 0,
    sourceStateVersion: Number.isFinite(output.sourceStateVersion) ? output.sourceStateVersion : 1
  };
}

const PARIS_LOCAL_NODES = new Set<MapNodeId>(["paris", "paris_rail_hub", "ourcq_line", "meaux"]);

export function isParisLocalEdge(edgeId: string, state: GameState): boolean {
  const edge = state.edges.find((item) => item.id === edgeId);
  if (!edge) return false;
  return PARIS_LOCAL_NODES.has(edge.from) || PARIS_LOCAL_NODES.has(edge.to);
}

export function canUseCityVehicle(state: GameState, unit: Unit): boolean {
  if (unit.side !== "allied") return false;
  if (!state.cityVehiclesUsed) return false;
  if (!state.cityVehicleBoostUntilMinutes) return false;
  if (state.currentTimeMinutes > state.cityVehicleBoostUntilMinutes) return false;
  return true;
}
