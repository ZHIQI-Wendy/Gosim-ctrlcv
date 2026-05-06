import { getEnvironmentalDecision, getFrenchCommandDecision, getGermanCommanderDecision, getGovernmentDecision, getReportDecision } from "@/lib/ai/decisionDispatch";
import { buildEnvironmentalContext } from "@/lib/ai/context/buildEnvironmentalContext";
import { buildFrenchCommandContext } from "@/lib/ai/context/buildFrenchCommandContext";
import { buildGermanCommanderContext } from "@/lib/ai/context/buildGermanCommanderContext";
import { buildGovernmentDecisionContext } from "@/lib/ai/context/buildGovernmentDecisionContext";
import { buildReportContext } from "@/lib/ai/context/buildReportContext";
import {
  COMBAT_STEP_GAME_MINUTES,
  DECISION_STEP_GAME_MINUTES,
  REPORT_MIN_INTERVAL_GAME_MINUTES,
  SIM_STEP_GAME_MINUTES,
  TOTAL_GAME_HOURS
} from "@/data/initialState";
import { resolveCombatStep } from "@/lib/combat";
import { resolveEnding, shouldEndGame, updateSustainedThreatTimers } from "@/lib/endings";
import { cloneAndClampState } from "@/lib/movement";
import { applyGermanIntent, createOrderFromParserOutput, processOrders, advanceMovingUnits, PublicEvent } from "@/lib/orders";
import { calculateParisThreat } from "@/lib/parisThreat";
import { clamp, makeId } from "@/lib/utils";
import {
  EndingType,
  GameState,
  MapNodeId,
  Report,
  ReportTone
} from "@/types";
import { validateEnvironmentalOutput, validateFrenchParserOutput, validateGermanOutput, validateGovernmentDecision, validateReportOutput } from "@/lib/validators";

export type PlayerCommandIntent = {
  rawText: string;
  selectedNodeId?: MapNodeId;
  selectedUnitId?: string;
};

export type EngineLoopState = {
  simAccumulatorMinutes: number;
  decisionAccumulatorMinutes: number;
  combatAccumulatorMinutes: number;
  reportAccumulatorMinutes: number;
};

export type EngineTickInput = {
  state: GameState;
  loopState: EngineLoopState;
  elapsedGameMinutes: number;
  pendingCommands: PlayerCommandIntent[];
  selectedNodeId?: MapNodeId | null;
  recentEvents: string[];
  reportTone?: ReportTone;
};

export type EngineTickResult = {
  state: GameState;
  loopState: EngineLoopState;
  ending: EndingType | null;
  consumedCommandCount: number;
  recentEvents: string[];
};

export function createLoopState(): EngineLoopState {
  return {
    simAccumulatorMinutes: 0,
    decisionAccumulatorMinutes: 0,
    combatAccumulatorMinutes: 0,
    reportAccumulatorMinutes: 0
  };
}

function pushReport(state: GameState, report: Omit<Report, "id" | "createdAtMinutes">): void {
  state.reports.unshift({
    id: makeId("report"),
    createdAtMinutes: state.currentTimeMinutes,
    ...report
  });
  state.reports = state.reports.slice(0, 80);

  if (report.knowledgeHint) {
    state.knowledgeCards.unshift({
      id: makeId("card"),
      title: report.headline,
      content: report.knowledgeHint,
      discoveredAtMinutes: state.currentTimeMinutes
    });
    state.knowledgeCards = state.knowledgeCards.slice(0, 16);
  }
}

function appendFallbackReport(state: GameState, details: string): void {
  pushReport(state, {
    headline: "AI fallback used",
    reportText: details,
    advisorLine: "Simulation continued using validated mock decision path.",
    eventType: "ai_fallback"
  });
}

function updateLocalContact(state: GameState): void {
  for (const node of state.nodes) {
    const alliedFront = state.units.some(
      (unit) => unit.side === "allied" && unit.role === "front" && unit.nodeId === node.id && unit.strength > 0
    );
    const germanFront = state.units.some(
      (unit) => unit.side === "german" && unit.role === "front" && unit.nodeId === node.id && unit.strength > 0
    );

    if (alliedFront && germanFront) {
      node.control = "contested";
    }
  }
}

function applyNoOpDrift(state: GameState): void {
  state.units.forEach((unit) => {
    if (unit.role === "front") {
      unit.fatigue = clamp(unit.fatigue + 1.5);
      unit.supply = clamp(unit.supply - 1);
    } else if (unit.role === "moving") {
      unit.fatigue = clamp(unit.fatigue + 1);
      unit.supply = clamp(unit.supply - 2);
    } else {
      unit.fatigue = clamp(unit.fatigue + 0.5);
      unit.supply = clamp(unit.supply - 0.4);
    }

    if (unit.role !== "moving") {
      unit.readiness = clamp(unit.readiness + (unit.stance === "hold" ? 0.5 : 0.2));
    }
  });

  state.railwayCongestion = clamp(state.railwayCongestion + 0.5);

  if (state.germanOperationalMomentum > 65 && state.germanCommandCohesion < 70) {
    state.flankGap = clamp(state.flankGap + 1.5);
  }

  if (state.parisThreat > 75) {
    state.cityStability = clamp(state.cityStability - 1.2);
    state.politicalPressure = clamp(state.politicalPressure + 1.5);
  }

  state.shortTermRedeployDelayMinutes = Math.max(0, state.shortTermRedeployDelayMinutes - SIM_STEP_GAME_MINUTES);
}

function maybeDiscoverParisTransport(state: GameState, selectedNodeId?: MapNodeId): boolean {
  if (selectedNodeId !== "paris") return false;
  if (state.parisThreat <= 70 || state.cityVehiclesDiscovered) return false;

  state.cityVehiclesDiscovered = true;
  pushReport(state, {
    headline: "Urban Transport Observation",
    reportText:
      "Paris transport is still operating, but mostly for civilian commuting. Some vehicles are concentrated around stations, squares, and police-controlled roads.",
    advisorLine: "This option requires explicit command language to requisition.",
    eventType: "discovery"
  });
  return true;
}

function maybeNeedsGovernmentDecision(state: GameState, recentEvents: string[]): boolean {
  if (state.parisThreat > 75) return true;
  if (state.politicalPressure > 75) return true;
  if (state.cityStability < 45) return true;
  if (state.governmentCollapseRisk > 65) return true;
  if (state.invalidCommandsInLast6Hours >= 2) return true;
  return recentEvents.some((event) => event.toLowerCase().includes("paris crisis"));
}

async function runSimStep(state: GameState): Promise<PublicEvent[]> {
  const moveEvents = advanceMovingUnits(state, SIM_STEP_GAME_MINUTES);
  applyNoOpDrift(state);
  updateLocalContact(state);

  state.currentTimeMinutes += SIM_STEP_GAME_MINUTES;
  state.parisThreat = calculateParisThreat(state);
  updateSustainedThreatTimers(state, SIM_STEP_GAME_MINUTES);

  return moveEvents;
}

async function runDecisionStep(
  state: GameState,
  commands: PlayerCommandIntent[],
  recentEvents: string[]
): Promise<{ consumedCount: number; events: string[]; publicEvents: PublicEvent[] }> {
  const events: string[] = [];
  const publicEvents: PublicEvent[] = [];

  let consumedCount = 0;
  for (const command of commands) {
    maybeDiscoverParisTransport(state, command.selectedNodeId);

    const parserInput = buildFrenchCommandContext(
      state,
      command.rawText,
      command.selectedNodeId,
      command.selectedUnitId,
      recentEvents
    );

    const parserDecision = await getFrenchCommandDecision(parserInput);
    if (parserDecision.usedFallback) {
      appendFallbackReport(state, parserDecision.error ?? "French command parser AI failed");
      events.push("AI fallback used");
    }

    const safeOutput = validateFrenchParserOutput(state, parserDecision.output);
    const order = createOrderFromParserOutput(safeOutput, state.currentTimeMinutes, state);
    state.orderQueue.push(order);
    consumedCount += 1;

    events.push(`Player order parsed: ${safeOutput.action}`);
  }

  const germanInput = buildGermanCommanderContext(state, recentEvents);
  const germanDecision = await getGermanCommanderDecision(germanInput);
  if (germanDecision.usedFallback) {
    appendFallbackReport(state, germanDecision.error ?? "German commander AI failed");
    events.push("AI fallback used");
  }

  const safeGerman = validateGermanOutput(state, germanDecision.output);
  const germanResult = applyGermanIntent(state, safeGerman);
  events.push(germanResult.event);
  publicEvents.push(germanResult.publicEvent);

  const orderOutcome = processOrders(state);
  events.push(...orderOutcome.events);
  publicEvents.push(...orderOutcome.publicEvents);

  if (maybeNeedsGovernmentDecision(state, recentEvents)) {
    const govInput = buildGovernmentDecisionContext(state, recentEvents);
    const govDecision = await getGovernmentDecision(govInput);
    if (govDecision.usedFallback) {
      appendFallbackReport(state, govDecision.error ?? "Government decision AI failed");
      events.push("AI fallback used");
    }

    const safeGov = validateGovernmentDecision(govDecision.output);
    if (safeGov.trigger) {
      state.cityStability = clamp(state.cityStability + safeGov.stateDelta.cityStability);
      state.politicalPressure = clamp(state.politicalPressure + safeGov.stateDelta.politicalPressure);
      state.commandCohesion = clamp(state.commandCohesion + safeGov.stateDelta.commandCohesion);
      state.governmentCollapseRisk = clamp(
        state.governmentCollapseRisk + safeGov.stateDelta.governmentCollapseRisk
      );
      state.alliedOperationalMomentum = clamp(
        state.alliedOperationalMomentum + safeGov.stateDelta.alliedOperationalMomentum
      );

      events.push(`Government event: ${safeGov.action}`);
      publicEvents.push({
        type: "government_decision",
        resultSummary: safeGov.publicMessage
      });
    }
  }

  if (state.germanOperationalMomentum > 75 && state.germanCommandCohesion < 60) {
    state.flankGap = clamp(state.flankGap + 2);
  }

  state.parisThreat = calculateParisThreat(state);
  return { consumedCount, events, publicEvents };
}

async function runCombatStep(state: GameState): Promise<{ events: string[]; publicEvents: PublicEvent[] }> {
  const events: string[] = [];
  const publicEvents: PublicEvent[] = [];

  const combats = resolveCombatStep(state);
  for (const combat of combats) {
    events.push(
      `Combat at ${combat.nodeId}: Allied loss ${combat.alliedLoss.toFixed(1)}, German loss ${combat.germanLoss.toFixed(1)}.`
    );

    publicEvents.push({
      type: "combat",
      nodeId: combat.nodeId,
      unitIds: combat.involvedUnitIds,
      resultSummary: `Heavy exchange at ${combat.nodeId}; losses A:${combat.alliedLoss.toFixed(1)} G:${combat.germanLoss.toFixed(1)}.`
    });

    if (!combat.major) continue;

    const envInput = buildEnvironmentalContext(state, combat);
    const envDecision = await getEnvironmentalDecision(envInput);
    if (envDecision.usedFallback) {
      appendFallbackReport(state, envDecision.error ?? "Environmental adjudicator AI failed");
      events.push("AI fallback used");
    }

    const safeEnv = validateEnvironmentalOutput(envDecision.output);
    if (safeEnv.modifierType !== "no_modifier") {
      const impacted =
        safeEnv.affectedUnitIds.length > 0
          ? state.units.filter((unit) => safeEnv.affectedUnitIds.includes(unit.id))
          : state.units.filter((unit) => combat.involvedUnitIds.includes(unit.id));

      impacted.forEach((unit) => {
        if (safeEnv.affectedSide !== "both" && safeEnv.affectedSide !== "none" && unit.side !== safeEnv.affectedSide) {
          return;
        }

        unit.strength = Math.max(0, unit.strength * (1 - safeEnv.numericModifiers.extraStrengthLossPct));
        unit.morale = clamp(unit.morale + safeEnv.numericModifiers.moraleDelta);
        unit.fatigue = clamp(unit.fatigue + safeEnv.numericModifiers.fatigueDelta);
      });

      state.shortTermRedeployDelayMinutes += safeEnv.numericModifiers.movementDelayMinutes;
      const node = state.nodes.find((item) => item.id === combat.nodeId);
      if (node) {
        node.controlPressure = clamp((node.controlPressure ?? 0) + safeEnv.numericModifiers.nodeControlDelta, -100, 100);
      }

      events.push(`Environmental modifier: ${safeEnv.modifierType}.`);
      publicEvents.push({
        type: "environmental_modifier",
        nodeId: combat.nodeId,
        resultSummary: safeEnv.rationale
      });
    }
  }

  state.parisThreat = calculateParisThreat(state);
  return { events, publicEvents };
}

async function runReportStep(
  state: GameState,
  publicEvents: PublicEvent[],
  recentEvents: string[],
  tone: ReportTone
): Promise<void> {
  const context = buildReportContext(state, publicEvents, tone);
  const reportDecision = await getReportDecision(context);

  if (reportDecision.usedFallback) {
    appendFallbackReport(state, reportDecision.error ?? "Report generator AI failed");
  }

  const safe = validateReportOutput(reportDecision.output);
  pushReport(state, {
    headline: safe.headline,
    reportText: safe.reportText,
    advisorLine: safe.advisorLine,
    knowledgeHint: safe.knowledgeHint,
    eventType: publicEvents[publicEvents.length - 1]?.type ?? "periodic"
  });

  if (recentEvents.some((event) => event.toLowerCase().includes("ai fallback used"))) {
    appendFallbackReport(state, "One or more AI modules were replaced by mocks this cycle.");
  }
}

function mergeRecentEvents(existing: string[], additions: string[]): string[] {
  return [...existing, ...additions].slice(-24);
}

export async function runEngineTick(input: EngineTickInput): Promise<EngineTickResult> {
  let state = cloneAndClampState(input.state);
  let loopState = { ...input.loopState };
  let recentEvents = [...input.recentEvents];

  if (input.selectedNodeId) {
    maybeDiscoverParisTransport(state, input.selectedNodeId);
  }

  if (state.gameEnded) {
    return {
      state,
      loopState,
      ending: resolveEnding(state),
      consumedCommandCount: 0,
      recentEvents
    };
  }

  loopState.simAccumulatorMinutes += input.elapsedGameMinutes;
  loopState.decisionAccumulatorMinutes += input.elapsedGameMinutes;
  loopState.combatAccumulatorMinutes += input.elapsedGameMinutes;
  loopState.reportAccumulatorMinutes += input.elapsedGameMinutes;

  const pendingCommands = [...input.pendingCommands];
  let consumedCommandCount = 0;

  while (loopState.simAccumulatorMinutes >= SIM_STEP_GAME_MINUTES && !state.gameEnded) {
    loopState.simAccumulatorMinutes -= SIM_STEP_GAME_MINUTES;

    const simPublicEvents = await runSimStep(state);
    const stepEvents: string[] = simPublicEvents.map((evt) => evt.resultSummary);

    let decisionPublicEvents: PublicEvent[] = [];
    if (loopState.decisionAccumulatorMinutes >= DECISION_STEP_GAME_MINUTES) {
      loopState.decisionAccumulatorMinutes -= DECISION_STEP_GAME_MINUTES;
      const consumed = pendingCommands.splice(0, pendingCommands.length);
      const decision = await runDecisionStep(state, consumed, recentEvents);
      consumedCommandCount += decision.consumedCount;
      stepEvents.push(...decision.events);
      decisionPublicEvents = decision.publicEvents;
    }

    let combatPublicEvents: PublicEvent[] = [];
    if (loopState.combatAccumulatorMinutes >= COMBAT_STEP_GAME_MINUTES) {
      loopState.combatAccumulatorMinutes -= COMBAT_STEP_GAME_MINUTES;
      const combat = await runCombatStep(state);
      stepEvents.push(...combat.events);
      combatPublicEvents = combat.publicEvents;
    }

    const mergedPublicEvents = [...simPublicEvents, ...decisionPublicEvents, ...combatPublicEvents];

    const majorEvent = mergedPublicEvents.some((event) => {
      const kind = event.type.toLowerCase();
      return (
        kind.includes("combat") ||
        kind.includes("government") ||
        kind.includes("urban") ||
        kind.includes("environmental")
      );
    });

    if (loopState.reportAccumulatorMinutes >= REPORT_MIN_INTERVAL_GAME_MINUTES || majorEvent) {
      if (loopState.reportAccumulatorMinutes >= REPORT_MIN_INTERVAL_GAME_MINUTES) {
        loopState.reportAccumulatorMinutes -= REPORT_MIN_INTERVAL_GAME_MINUTES;
      } else {
        loopState.reportAccumulatorMinutes = 0;
      }
      await runReportStep(state, mergedPublicEvents, mergeRecentEvents(recentEvents, stepEvents), input.reportTone ?? "staff_report");
    }

    recentEvents = mergeRecentEvents(recentEvents, stepEvents);

    if (state.currentTimeMinutes >= TOTAL_GAME_HOURS * 60 || shouldEndGame(state)) {
      state.gameEnded = true;
      break;
    }
  }

  const ending = state.gameEnded ? resolveEnding(state) : null;
  return {
    state,
    loopState,
    ending,
    consumedCommandCount,
    recentEvents
  };
}
