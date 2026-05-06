"use client";

import { create } from "zustand";
import {
  COMBAT_STEP_GAME_MINUTES,
  DECISION_STEP_GAME_MINUTES,
  REPORT_MIN_INTERVAL_GAME_MINUTES,
  SIM_STEP_GAME_MINUTES,
  TOTAL_GAME_HOURS,
  createInitialGameState
} from "@/data/initialState";
import { getEnvironmentalDecision, getFrenchCommandDecision, getGermanCommanderDecision, getGovernmentDecision, getReportDecision } from "@/lib/ai/decisionDispatch";
import { buildEnvironmentalContext } from "@/lib/ai/context/buildEnvironmentalContext";
import { buildFrenchCommandContext } from "@/lib/ai/context/buildFrenchCommandContext";
import { buildGermanCommanderContext } from "@/lib/ai/context/buildGermanCommanderContext";
import { buildGovernmentDecisionContext } from "@/lib/ai/context/buildGovernmentDecisionContext";
import { buildReportContext } from "@/lib/ai/context/buildReportContext";
import { resolveCombatStep } from "@/lib/combat";
import { updateSustainedThreatTimers, resolveEnding, shouldEndGame } from "@/lib/endings";
import { cloneAndClampState } from "@/lib/movement";
import { applyGermanIntent, createOrderFromParserOutput, processOrders, advanceMovingUnits, PublicEvent } from "@/lib/orders";
import { calculateParisThreat } from "@/lib/parisThreat";
import { gameMinutesFromRealSeconds, SpeedLevel } from "@/lib/timeLoop";
import { clamp, makeId } from "@/lib/utils";
import { validateEnvironmentalOutput, validateFrenchParserOutput, validateGermanOutput, validateGovernmentDecision, validateReportOutput } from "@/lib/validators";
import { GAME_CONFIG } from "@/lib/config/gameConfig";
import { buildAuditLinesFromPublicEvents, postActionAuditLines } from "@/lib/actionAudit";
import {
  EndingType,
  GameState,
  MapNodeId,
  Report,
  ReportTone
} from "@/types";

export type PlayerCommandIntent = {
  rawText: string;
  selectedNodeId?: MapNodeId;
  selectedUnitId?: string;
};

type DecisionBundle = {
  parserOutputs: ReturnType<typeof validateFrenchParserOutput>[];
  germanOutput: ReturnType<typeof validateGermanOutput>;
  governmentOutput?: ReturnType<typeof validateGovernmentDecision>;
  report?: ReturnType<typeof validateReportOutput>;
  eventLabels: string[];
  fallbackMessages: string[];
};

type EnvironmentalBundle = {
  nodeId: MapNodeId;
  output?: ReturnType<typeof validateEnvironmentalOutput>;
  report?: ReturnType<typeof validateReportOutput>;
  fallbackMessages: string[];
};

type ReportBundle = {
  report?: ReturnType<typeof validateReportOutput>;
  fallbackMessages: string[];
  eventType?: string;
};

export type EngineLoopState = {
  simAccumulatorMinutes: number;
  decisionAccumulatorMinutes: number;
  combatAccumulatorMinutes: number;
  reportAccumulatorMinutes: number;
};

interface GameStore {
  game: GameState;
  ending: EndingType | null;
  selectedNodeId: MapNodeId | null;
  selectedUnitId: string | null;
  pendingCommands: PlayerCommandIntent[];
  recentEvents: string[];
  loopState: EngineLoopState;
  isPaused: boolean;
  speedLevel: SpeedLevel;
  isTickRunning: boolean;
  reportTone: ReportTone;
  aiStatusText: string | null;
  isDecisionPending: boolean;
  sessionId: number;

  enqueueCommand: (text: string) => void;
  runTick: (realSecondsElapsed: number) => Promise<void>;
  togglePause: () => void;
  decreaseSpeed: () => void;
  increaseSpeed: () => void;
  setReportTone: (tone: ReportTone) => void;
  selectNode: (nodeId: MapNodeId) => void;
  closeNode: () => void;
  selectUnit: (unitId: string | null) => void;
  mobilizeCityVehicles: () => void;
  dispatchCityForces: () => void;
  reset: () => void;
  demoAdvanceHours: (hours: number) => void;
  demoPushReport: (headline: string, reportText: string, advisorLine?: string, eventType?: string) => void;
  demoMoveUnit: (unitId: string, nodeId: MapNodeId, overrides?: Partial<GameState["units"][number]>) => void;
  demoSetEnding: (ending: EndingType | null) => void;
  demoSetAiStatus: (status: string | null, pending?: boolean) => void;
  demoClearPendingCommands: () => void;
}

const SPEED_LEVELS: SpeedLevel[] = ["SLOW", "NORMAL", "FAST"];

function nextSpeed(current: SpeedLevel, direction: -1 | 1): SpeedLevel {
  const index = SPEED_LEVELS.indexOf(current);
  return SPEED_LEVELS[Math.max(0, Math.min(SPEED_LEVELS.length - 1, index + direction))];
}

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

function mergeRecentEvents(existing: string[], additions: string[]): string[] {
  return [...existing, ...additions].slice(-24);
}

function decisionStatusText(commands: PlayerCommandIntent[]): string {
  return commands.length > 0 ? "Orders relayed through staff channels." : "Operational assessment in progress.";
}

function applyDecisionBundleToGame(
  game: GameState,
  bundle: DecisionBundle
): { events: string[]; publicEvents: PublicEvent[] } {
  const liveEvents: string[] = [...bundle.eventLabels];
  const livePublicEvents: PublicEvent[] = [];

  for (const output of bundle.parserOutputs) {
    game.orderQueue.push(createOrderFromParserOutput(output, game.currentTimeMinutes, game));
  }

  const germanResult = applyGermanIntent(game, bundle.germanOutput);
  liveEvents.push(germanResult.event);
  livePublicEvents.push(germanResult.publicEvent);

  const orderOutcome = processOrders(game);
  liveEvents.push(...orderOutcome.events);
  livePublicEvents.push(...orderOutcome.publicEvents);

  if (bundle.governmentOutput?.trigger) {
    game.cityStability = clamp(game.cityStability + bundle.governmentOutput.stateDelta.cityStability);
    game.politicalPressure = clamp(game.politicalPressure + bundle.governmentOutput.stateDelta.politicalPressure);
    game.commandCohesion = clamp(game.commandCohesion + bundle.governmentOutput.stateDelta.commandCohesion);
    game.governmentCollapseRisk = clamp(
      game.governmentCollapseRisk + bundle.governmentOutput.stateDelta.governmentCollapseRisk
    );
    game.alliedOperationalMomentum = clamp(
      game.alliedOperationalMomentum + bundle.governmentOutput.stateDelta.alliedOperationalMomentum
    );

    livePublicEvents.push({
      type: "government_decision",
      resultSummary: bundle.governmentOutput.publicMessage
    });
  }

  for (const fallbackMessage of bundle.fallbackMessages) {
    appendFallbackReport(game, fallbackMessage);
  }

  if (bundle.report) {
    pushReport(game, {
      headline: bundle.report.headline,
      reportText: bundle.report.reportText,
      advisorLine: bundle.report.advisorLine,
      knowledgeHint: bundle.report.knowledgeHint,
      eventType: livePublicEvents[livePublicEvents.length - 1]?.type ?? "decision"
    });
  }

  return {
    events: liveEvents,
    publicEvents: livePublicEvents
  };
}

function applyEnvironmentalBundleToGame(game: GameState, bundle: EnvironmentalBundle): void {
  if (!bundle.output) return;

  const output = bundle.output;
  for (const fallbackMessage of bundle.fallbackMessages) {
    appendFallbackReport(game, fallbackMessage);
  }

  if (output.modifierType === "no_modifier") return;

  const nodeUnits = game.units.filter((unit) => unit.nodeId === bundle.nodeId);
  const impacted =
    output.affectedUnitIds.length > 0
      ? game.units.filter((unit) => output.affectedUnitIds.includes(unit.id))
      : nodeUnits;

  impacted.forEach((unit) => {
    if (output.affectedSide !== "both" && output.affectedSide !== "none" && unit.side !== output.affectedSide) {
      return;
    }

    unit.strength = Math.max(0, unit.strength * (1 - output.numericModifiers.extraStrengthLossPct));
    unit.morale = clamp(unit.morale + output.numericModifiers.moraleDelta);
    unit.fatigue = clamp(unit.fatigue + output.numericModifiers.fatigueDelta);
  });

  game.shortTermRedeployDelayMinutes += output.numericModifiers.movementDelayMinutes;
  const node = game.nodes.find((item) => item.id === bundle.nodeId);
  if (node) {
    node.controlPressure = clamp((node.controlPressure ?? 0) + output.numericModifiers.nodeControlDelta, -100, 100);
  }

  if (bundle.report) {
    pushReport(game, {
      headline: bundle.report.headline,
      reportText: bundle.report.reportText,
      advisorLine: bundle.report.advisorLine,
      knowledgeHint: bundle.report.knowledgeHint,
      eventType: "environmental_modifier"
    });
  }
}

function applyReportBundleToGame(game: GameState, bundle: ReportBundle): void {
  const report = bundle.report;
  if (!report) return;

  for (const fallbackMessage of bundle.fallbackMessages) {
    appendFallbackReport(game, fallbackMessage);
  }

  pushReport(game, {
    headline: report.headline,
    reportText: report.reportText,
    advisorLine: report.advisorLine,
    knowledgeHint: report.knowledgeHint,
    eventType: bundle.eventType
  });
}

function runSimStep(state: GameState): PublicEvent[] {
  const moveEvents = advanceMovingUnits(state, SIM_STEP_GAME_MINUTES);
  applyNoOpDrift(state);
  updateLocalContact(state);

  state.currentTimeMinutes += SIM_STEP_GAME_MINUTES;
  state.parisThreat = calculateParisThreat(state);
  updateSustainedThreatTimers(state, SIM_STEP_GAME_MINUTES);

  return moveEvents;
}

function runCombatStep(state: GameState): {
  events: string[];
  publicEvents: PublicEvent[];
  majorCombats: ReturnType<typeof resolveCombatStep>;
} {
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
  }

  state.parisThreat = calculateParisThreat(state);
  return { events, publicEvents, majorCombats: combats.filter((combat) => combat.major) };
}

async function resolveDecisionBundle(
  snapshotState: GameState,
  commands: PlayerCommandIntent[],
  recentEvents: string[]
): Promise<DecisionBundle> {
  const snapshot = cloneAndClampState(snapshotState);
  const eventLabels: string[] = [];
  const publicEvents: PublicEvent[] = [];
  const fallbackMessages: string[] = [];
  const parserPromises = commands.map((command) => {
    const parserInput = buildFrenchCommandContext(
      snapshot,
      command.rawText,
      command.selectedNodeId,
      command.selectedUnitId,
      recentEvents
    );
    return getFrenchCommandDecision(parserInput);
  });

  const germanPromise = getGermanCommanderDecision(buildGermanCommanderContext(snapshot, recentEvents));
  const governmentPromise = getGovernmentDecision(buildGovernmentDecisionContext(snapshot, recentEvents));

  const [parserResults, germanDecision, governmentDecision] = await Promise.all([
    Promise.all(parserPromises),
    germanPromise,
    governmentPromise
  ]);

  const parserOutputs: ReturnType<typeof validateFrenchParserOutput>[] = [];
  for (const parserResult of parserResults) {
    if (parserResult.usedFallback) {
      fallbackMessages.push(parserResult.error ?? "French command parser AI failed");
      eventLabels.push("AI fallback used");
    }

    const safeOutput = validateFrenchParserOutput(snapshot, parserResult.output);
    parserOutputs.push(safeOutput);
    snapshot.orderQueue.push(createOrderFromParserOutput(safeOutput, snapshot.currentTimeMinutes, snapshot));
    eventLabels.push(`Player order parsed: ${safeOutput.action}`);
  }

  if (germanDecision.usedFallback) {
    fallbackMessages.push(germanDecision.error ?? "German commander AI failed");
    eventLabels.push("AI fallback used");
  }

  const safeGerman = validateGermanOutput(snapshot, germanDecision.output);
  const germanResult = applyGermanIntent(snapshot, safeGerman);
  eventLabels.push(germanResult.event);
  publicEvents.push(germanResult.publicEvent);

  const orderOutcome = processOrders(snapshot);
  eventLabels.push(...orderOutcome.events);
  publicEvents.push(...orderOutcome.publicEvents);

  let governmentOutput: ReturnType<typeof validateGovernmentDecision> | undefined;
  if (governmentDecision.usedFallback) {
    fallbackMessages.push(governmentDecision.error ?? "Government decision AI failed");
    eventLabels.push("AI fallback used");
  }

  governmentOutput = validateGovernmentDecision(governmentDecision.output);
  snapshot.cityStability = clamp(snapshot.cityStability + governmentOutput.stateDelta.cityStability);
  snapshot.politicalPressure = clamp(snapshot.politicalPressure + governmentOutput.stateDelta.politicalPressure);
  snapshot.commandCohesion = clamp(snapshot.commandCohesion + governmentOutput.stateDelta.commandCohesion);
  snapshot.governmentCollapseRisk = clamp(
    snapshot.governmentCollapseRisk + governmentOutput.stateDelta.governmentCollapseRisk
  );
  snapshot.alliedOperationalMomentum = clamp(
    snapshot.alliedOperationalMomentum + governmentOutput.stateDelta.alliedOperationalMomentum
  );

  eventLabels.push(`Government event: ${governmentOutput.action}`);
  publicEvents.push({
    type: "government_decision",
    resultSummary: governmentOutput.publicMessage
  });

  return {
    parserOutputs,
    germanOutput: safeGerman,
    governmentOutput,
    report: undefined,
    eventLabels,
    fallbackMessages
  };
}

async function resolveEnvironmentalBundle(
  snapshotState: GameState,
  combat: ReturnType<typeof resolveCombatStep>[number],
  tone: ReportTone
): Promise<EnvironmentalBundle> {
  const snapshot = cloneAndClampState(snapshotState);
  const fallbackMessages: string[] = [];

  const envDecision = await getEnvironmentalDecision(buildEnvironmentalContext(snapshot, combat));
  if (envDecision.usedFallback) {
    fallbackMessages.push(envDecision.error ?? "Environmental adjudicator AI failed");
  }

  const output = validateEnvironmentalOutput(envDecision.output);
  let report: ReturnType<typeof validateReportOutput> | undefined;

  if (output.modifierType !== "no_modifier") {
    const reportDecision = await getReportDecision(
      buildReportContext(
        snapshot,
        [
          {
            type: "environmental_modifier",
            nodeId: combat.nodeId,
            resultSummary: output.rationale
          }
        ],
        tone
      )
    );
    if (reportDecision.usedFallback) {
      fallbackMessages.push(reportDecision.error ?? "Report generator AI failed");
    }
    report = validateReportOutput(reportDecision.output);
  }

  return {
    nodeId: combat.nodeId,
    output,
    report,
    fallbackMessages
  };
}

async function resolveReportBundle(
  snapshotState: GameState,
  publicEvents: PublicEvent[],
  tone: ReportTone
): Promise<ReportBundle> {
  const snapshot = cloneAndClampState(snapshotState);
  const fallbackMessages: string[] = [];
  const reportDecision = await getReportDecision(buildReportContext(snapshot, publicEvents, tone));
  if (reportDecision.usedFallback) {
    fallbackMessages.push(reportDecision.error ?? "Report generator AI failed");
  }

  return {
    report: validateReportOutput(reportDecision.output),
    fallbackMessages,
    eventType: publicEvents[publicEvents.length - 1]?.type ?? "periodic"
  };
}

export const useGameStore = create<GameStore>((set, get) => {
  const launchDecisionCycle = (
    snapshotState: GameState,
    commands: PlayerCommandIntent[],
    recentEvents: string[],
    tone: ReportTone,
    sessionId: number
  ) => {
    set(() => ({
      isDecisionPending: true,
      aiStatusText: decisionStatusText(commands)
    }));

    void resolveDecisionBundle(snapshotState, commands, recentEvents)
      .then((bundle) => {
        const current = get();
        if (current.sessionId !== sessionId) return;

        let auditLines: string[] = [];
        set((prev) => {
          if (prev.sessionId !== sessionId) return prev;

          const game = cloneAndClampState(prev.game);
          const applied = applyDecisionBundleToGame(game, bundle);
          const liveEvents = applied.events;
          auditLines = buildAuditLinesFromPublicEvents(game, applied.publicEvents);

          const mergedRecentEvents = mergeRecentEvents(prev.recentEvents, liveEvents);
          const ended = game.currentTimeMinutes >= TOTAL_GAME_HOURS * 60 || shouldEndGame(game);
          if (ended) {
            game.gameEnded = true;
          }

          return {
            game,
            recentEvents: mergedRecentEvents,
            ending: ended ? resolveEnding(game) : prev.ending,
            aiStatusText: null,
            isDecisionPending: false
          };
        });
        void postActionAuditLines(auditLines).catch(() => undefined);
      })
      .catch((error) => {
        const current = get();
        if (current.sessionId !== sessionId) return;

        set((prev) => {
          if (prev.sessionId !== sessionId) return prev;

          const game = cloneAndClampState(prev.game);
          appendFallbackReport(game, error instanceof Error ? error.message : String(error));
          return {
            game,
            aiStatusText: null,
            isDecisionPending: false
          };
        });
      });
  };

  const launchEnvironmentalCycle = (
    snapshotState: GameState,
    combat: ReturnType<typeof resolveCombatStep>[number],
    tone: ReportTone,
    sessionId: number
  ) => {
    void resolveEnvironmentalBundle(snapshotState, combat, tone)
      .then((bundle) => {
        const current = get();
        if (current.sessionId !== sessionId) return;

        set((prev) => {
          if (prev.sessionId !== sessionId || !bundle.output) return prev;

          const game = cloneAndClampState(prev.game);
          applyEnvironmentalBundleToGame(game, bundle);

          return { game };
        });
      })
      .catch(() => undefined);
  };

  const launchReportCycle = (
    snapshotState: GameState,
    publicEvents: PublicEvent[],
    tone: ReportTone,
    sessionId: number
  ) => {
    void resolveReportBundle(snapshotState, publicEvents, tone)
      .then((bundle) => {
        const current = get();
        if (current.sessionId !== sessionId || !bundle.report) return;

        set((prev) => {
          if (prev.sessionId !== sessionId) return prev;

          const game = cloneAndClampState(prev.game);
          if (!bundle.report) return prev;
          applyReportBundleToGame(game, bundle);

          return { game };
        });
      })
      .catch(() => undefined);
  };

  return {
    game: createInitialGameState(),
    ending: null,
    selectedNodeId: null,
    selectedUnitId: null,
    pendingCommands: [],
    recentEvents: [],
    loopState: createLoopState(),
    isPaused: false,
    speedLevel: "NORMAL",
    isTickRunning: false,
    reportTone: "staff_report",
    aiStatusText: null,
    isDecisionPending: false,
    sessionId: 1,

    enqueueCommand: (text) => {
      const trimmed = text.trim().slice(0, 160);
      if (!trimmed) return;

      const state = get();
      if (state.ending) return;

      set((prev) => ({
        pendingCommands: [
          ...prev.pendingCommands,
          {
            rawText: trimmed,
            selectedNodeId: prev.selectedNodeId ?? undefined,
            selectedUnitId: prev.selectedUnitId ?? undefined
          }
        ]
      }));
    },

    runTick: async (realSecondsElapsed) => {
      const current = get();
      if (current.ending || current.isPaused || current.isTickRunning) return;

      set(() => ({ isTickRunning: true }));
      try {
        const minutes = gameMinutesFromRealSeconds(realSecondsElapsed, get().speedLevel);

        if (GAME_CONFIG.aiExecutionMode === "sync") {
          const snapshot = get();
          const game = cloneAndClampState(snapshot.game);
          const loopState = { ...snapshot.loopState };
          let recentEvents = [...snapshot.recentEvents];
          let pendingCommands = snapshot.pendingCommands;

          if (snapshot.selectedNodeId) {
            maybeDiscoverParisTransport(game, snapshot.selectedNodeId);
          }

          loopState.simAccumulatorMinutes += minutes;
          loopState.decisionAccumulatorMinutes += minutes;
          loopState.combatAccumulatorMinutes += minutes;
          loopState.reportAccumulatorMinutes += minutes;

          while (loopState.simAccumulatorMinutes >= SIM_STEP_GAME_MINUTES && !game.gameEnded) {
            loopState.simAccumulatorMinutes -= SIM_STEP_GAME_MINUTES;

            const simPublicEvents = runSimStep(game);
            const stepEvents = simPublicEvents.map((event) => event.resultSummary);
            let mergedPublicEvents: PublicEvent[] = [...simPublicEvents];

            const orderProgress = processOrders(game);
            stepEvents.push(...orderProgress.events);
            mergedPublicEvents = [...mergedPublicEvents, ...orderProgress.publicEvents];
            void postActionAuditLines(buildAuditLinesFromPublicEvents(game, orderProgress.publicEvents)).catch(
              () => undefined
            );

            if (loopState.combatAccumulatorMinutes >= COMBAT_STEP_GAME_MINUTES) {
              loopState.combatAccumulatorMinutes -= COMBAT_STEP_GAME_MINUTES;
              const combat = runCombatStep(game);
              stepEvents.push(...combat.events);
              mergedPublicEvents = [...mergedPublicEvents, ...combat.publicEvents];

              for (const majorCombat of combat.majorCombats) {
                const envBundle = await resolveEnvironmentalBundle(game, majorCombat, snapshot.reportTone);
                applyEnvironmentalBundleToGame(game, envBundle);
              }
            }

            const majorEvent = mergedPublicEvents.some((event) => {
              const kind = event.type.toLowerCase();
              return (
                kind.includes("combat") ||
                kind.includes("government") ||
                kind.includes("urban") ||
                kind.includes("environmental")
              );
            });

            if (
              mergedPublicEvents.length > 0 &&
              (loopState.reportAccumulatorMinutes >= REPORT_MIN_INTERVAL_GAME_MINUTES || majorEvent)
            ) {
              if (loopState.reportAccumulatorMinutes >= REPORT_MIN_INTERVAL_GAME_MINUTES) {
                loopState.reportAccumulatorMinutes -= REPORT_MIN_INTERVAL_GAME_MINUTES;
              } else {
                loopState.reportAccumulatorMinutes = 0;
              }

              const reportBundle = await resolveReportBundle(game, mergedPublicEvents, snapshot.reportTone);
              applyReportBundleToGame(game, reportBundle);
            }

            recentEvents = mergeRecentEvents(recentEvents, stepEvents);

            if (game.currentTimeMinutes >= TOTAL_GAME_HOURS * 60 || shouldEndGame(game)) {
              game.gameEnded = true;
              break;
            }
          }

          let aiStatusText: string | null = snapshot.aiStatusText;
          let isDecisionPending = snapshot.isDecisionPending;

          if (loopState.decisionAccumulatorMinutes >= DECISION_STEP_GAME_MINUTES && !snapshot.isDecisionPending) {
            loopState.decisionAccumulatorMinutes -= DECISION_STEP_GAME_MINUTES;
            const commandsForDecision = [...pendingCommands];
            pendingCommands = [];
            aiStatusText = decisionStatusText(commandsForDecision);
            isDecisionPending = true;

            try {
              const bundle = await resolveDecisionBundle(game, commandsForDecision, recentEvents);
              const applied = applyDecisionBundleToGame(game, bundle);
              void postActionAuditLines(buildAuditLinesFromPublicEvents(game, applied.publicEvents)).catch(
                () => undefined
              );
              recentEvents = mergeRecentEvents(recentEvents, applied.events);
            } catch (error) {
              appendFallbackReport(game, error instanceof Error ? error.message : String(error));
            }

            aiStatusText = null;
            isDecisionPending = false;
          }

          const ended = game.gameEnded || game.currentTimeMinutes >= TOTAL_GAME_HOURS * 60 || shouldEndGame(game);
          if (ended) {
            game.gameEnded = true;
          }

          set((prev) => {
            if (prev.sessionId !== snapshot.sessionId) return { isTickRunning: false };
            return {
              game,
              loopState,
              recentEvents,
              pendingCommands,
              isTickRunning: false,
              ending: ended ? resolveEnding(game) : prev.ending,
              aiStatusText,
              isDecisionPending
            };
          });
          return;
        }

        set((prev) => {
          const game = cloneAndClampState(prev.game);
          const loopState = { ...prev.loopState };
          let recentEvents = [...prev.recentEvents];

          if (prev.selectedNodeId) {
            maybeDiscoverParisTransport(game, prev.selectedNodeId);
          }

          loopState.simAccumulatorMinutes += minutes;
          loopState.decisionAccumulatorMinutes += minutes;
          loopState.combatAccumulatorMinutes += minutes;
          loopState.reportAccumulatorMinutes += minutes;

          while (loopState.simAccumulatorMinutes >= SIM_STEP_GAME_MINUTES && !game.gameEnded) {
            loopState.simAccumulatorMinutes -= SIM_STEP_GAME_MINUTES;

            const simPublicEvents = runSimStep(game);
            const stepEvents = simPublicEvents.map((event) => event.resultSummary);
            let mergedPublicEvents: PublicEvent[] = [...simPublicEvents];

            const orderProgress = processOrders(game);
            stepEvents.push(...orderProgress.events);
            mergedPublicEvents = [...mergedPublicEvents, ...orderProgress.publicEvents];
            void postActionAuditLines(buildAuditLinesFromPublicEvents(game, orderProgress.publicEvents)).catch(
              () => undefined
            );

            if (loopState.combatAccumulatorMinutes >= COMBAT_STEP_GAME_MINUTES) {
              loopState.combatAccumulatorMinutes -= COMBAT_STEP_GAME_MINUTES;
              const combat = runCombatStep(game);
              stepEvents.push(...combat.events);
              mergedPublicEvents = [...mergedPublicEvents, ...combat.publicEvents];

              for (const majorCombat of combat.majorCombats) {
                launchEnvironmentalCycle(game, majorCombat, prev.reportTone, prev.sessionId);
              }
            }

            const majorEvent = mergedPublicEvents.some((event) => {
              const kind = event.type.toLowerCase();
              return (
                kind.includes("combat") ||
                kind.includes("government") ||
                kind.includes("urban") ||
                kind.includes("environmental")
              );
            });

            if (
              mergedPublicEvents.length > 0 &&
              (loopState.reportAccumulatorMinutes >= REPORT_MIN_INTERVAL_GAME_MINUTES || majorEvent)
            ) {
              if (loopState.reportAccumulatorMinutes >= REPORT_MIN_INTERVAL_GAME_MINUTES) {
                loopState.reportAccumulatorMinutes -= REPORT_MIN_INTERVAL_GAME_MINUTES;
              } else {
                loopState.reportAccumulatorMinutes = 0;
              }
              launchReportCycle(game, mergedPublicEvents, prev.reportTone, prev.sessionId);
            }

            recentEvents = mergeRecentEvents(recentEvents, stepEvents);

            if (game.currentTimeMinutes >= TOTAL_GAME_HOURS * 60 || shouldEndGame(game)) {
              game.gameEnded = true;
              break;
            }
          }

          let pendingCommands = prev.pendingCommands;
          let aiStatusText = prev.aiStatusText;
          let isDecisionPending = prev.isDecisionPending;

          if (loopState.decisionAccumulatorMinutes >= DECISION_STEP_GAME_MINUTES && !prev.isDecisionPending) {
            loopState.decisionAccumulatorMinutes -= DECISION_STEP_GAME_MINUTES;
            const commandsForDecision = [...pendingCommands];
            pendingCommands = [];
            aiStatusText = decisionStatusText(commandsForDecision);
            isDecisionPending = true;
            launchDecisionCycle(game, commandsForDecision, recentEvents, prev.reportTone, prev.sessionId);
          }

          return {
            game,
            loopState,
            recentEvents,
            pendingCommands,
            isTickRunning: false,
            ending: game.gameEnded ? resolveEnding(game) : prev.ending,
            aiStatusText,
            isDecisionPending
          };
        });
      } catch (error) {
        console.error("runTick failed", error);
        set(() => ({ isTickRunning: false }));
      }
    },

    togglePause: () => {
      set((prev) => ({ isPaused: !prev.isPaused }));
    },

    decreaseSpeed: () => {
      set((prev) => ({ speedLevel: nextSpeed(prev.speedLevel, -1) }));
    },

    increaseSpeed: () => {
      set((prev) => ({ speedLevel: nextSpeed(prev.speedLevel, 1) }));
    },

    setReportTone: (tone) => {
      set(() => ({ reportTone: tone }));
    },

    selectNode: (nodeId) => {
      set(() => ({ selectedNodeId: nodeId }));
    },

    closeNode: () => {
      set(() => ({ selectedNodeId: null }));
    },

    selectUnit: (unitId) => {
      set(() => ({ selectedUnitId: unitId }));
    },

    mobilizeCityVehicles: () => {
      const state = get();
      if (state.ending) return;

      set((prev) => ({
        pendingCommands: [
          ...prev.pendingCommands,
          {
            rawText: "Requisition city vehicles for rapid local transfer.",
            selectedNodeId: "paris",
            selectedUnitId: prev.selectedUnitId ?? undefined
          }
        ]
      }));
    },

    dispatchCityForces: () => {
      const state = get();
      if (state.ending || !state.selectedNodeId) return;

      const cmd = `Redeploy nearest reserve toward ${state.selectedNodeId}.`;
      set((prev) => ({
        pendingCommands: [
          ...prev.pendingCommands,
          {
            rawText: cmd,
            selectedNodeId: prev.selectedNodeId ?? undefined,
            selectedUnitId: prev.selectedUnitId ?? undefined
          }
        ]
      }));
    },

    reset: () => {
      set((prev) => ({
        game: createInitialGameState(),
        ending: null,
        selectedNodeId: null,
        selectedUnitId: null,
        pendingCommands: [],
        recentEvents: [],
        loopState: createLoopState(),
        isPaused: false,
        speedLevel: "NORMAL",
        isTickRunning: false,
        reportTone: "staff_report",
        aiStatusText: null,
        isDecisionPending: false,
        sessionId: prev.sessionId + 1
      }));
    },

    demoAdvanceHours: (hours) => {
      if (!Number.isFinite(hours) || hours <= 0) return;
      set((prev) => {
        const game = cloneAndClampState(prev.game);
        game.currentTimeMinutes += Math.round(hours * 60);
        return { game };
      });
    },

    demoPushReport: (headline, reportText, advisorLine, eventType = "demo") => {
      set((prev) => {
        const game = cloneAndClampState(prev.game);
        pushReport(game, {
          headline: headline.slice(0, 120),
          reportText: reportText.slice(0, 450),
          advisorLine: advisorLine?.slice(0, 180),
          eventType
        });
        return {
          game,
          recentEvents: mergeRecentEvents(prev.recentEvents, [`${headline}: ${reportText}`])
        };
      });
    },

    demoMoveUnit: (unitId, nodeId, overrides) => {
      set((prev) => {
        const game = cloneAndClampState(prev.game);
        const unit = game.units.find((item) => item.id === unitId);
        if (!unit) return prev;

        unit.nodeId = nodeId;
        unit.movingTo = undefined;
        unit.travelProgress = undefined;
        unit.role = overrides?.role ?? "front";
        unit.stance = overrides?.stance ?? unit.stance;
        unit.movementMode = undefined;
        Object.assign(unit, overrides ?? {});

        return { game };
      });
    },

    demoSetEnding: (ending) => {
      set((prev) => {
        const game = cloneAndClampState(prev.game);
        game.gameEnded = Boolean(ending);
        return { game, ending };
      });
    },

    demoSetAiStatus: (status, pending = false) => {
      set(() => ({
        aiStatusText: status,
        isDecisionPending: pending
      }));
    },

    demoClearPendingCommands: () => {
      set(() => ({
        pendingCommands: []
      }));
    }
  };
});

export type { SpeedLevel };
