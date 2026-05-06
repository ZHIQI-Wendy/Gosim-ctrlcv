"use client";

import { create } from "zustand";
import {
  COMBAT_STEP_GAME_MINUTES,
  REPORT_MIN_INTERVAL_GAME_MINUTES,
  SIM_STEP_GAME_MINUTES,
  TOTAL_GAME_HOURS,
  createInitialGameState
} from "@/data/initialState";
import {
  getDirectorDecision,
  getFrenchCommandDecision,
  getGermanCommanderDecision,
  getReportDecision
} from "@/lib/ai/decisionDispatch";
import { buildDirectorContext } from "@/lib/ai/context/buildDirectorContext";
import { buildFrenchCommandContext } from "@/lib/ai/context/buildFrenchCommandContext";
import { buildGermanCommanderContext } from "@/lib/ai/context/buildGermanCommanderContext";
import { buildReportContext } from "@/lib/ai/context/buildReportContext";
import { calculateTransmissionEfficiency } from "@/lib/ai/transmissionEfficiency";
import { resolveCombatStep } from "@/lib/combat";
import { updateSustainedThreatTimers, resolveEnding, shouldEndGame } from "@/lib/endings";
import { cloneAndClampState } from "@/lib/movement";
import { advanceMovingUnits, applyGermanIntent, createOrderFromParserOutput, processOrders, PublicEvent } from "@/lib/orders";
import { calculateParisThreat } from "@/lib/parisThreat";
import { gameMinutesFromRealSeconds, SpeedLevel } from "@/lib/timeLoop";
import { clamp, makeId } from "@/lib/utils";
import {
  validateDirectorOutput,
  validateFrenchParserOutput,
  validateGermanOutput,
  validateReportOutput
} from "@/lib/validators";
import { GAME_CONFIG } from "@/lib/config/gameConfig";
import { buildAuditLinesFromPublicEvents, postActionAuditLines } from "@/lib/actionAudit";
import { EndingType, GameState, MapNodeId, PendingAgentState, Report, ReportTone } from "@/types";

export type PlayerCommandIntent = {
  rawText: string;
  selectedNodeId?: MapNodeId;
  selectedUnitId?: string;
};

type FrenchCommandBundle = {
  parserOutputs: ReturnType<typeof validateFrenchParserOutput>[];
  eventLabels: string[];
  fallbackMessages: string[];
  sourceGameTimeMinutes: number;
  sourceStateVersion: number;
};

type GermanIntentBundle = {
  germanOutput: ReturnType<typeof validateGermanOutput>;
  eventLabel: string;
  publicEvent: PublicEvent;
  fallbackMessages: string[];
  sourceGameTimeMinutes: number;
  sourceStateVersion: number;
};

type DirectorBundle = {
  output: ReturnType<typeof validateDirectorOutput>;
  fallbackMessages: string[];
  eventLabels: string[];
  sourceGameTimeMinutes: number;
  sourceStateVersion: number;
};

type ReportBundle = {
  report: ReturnType<typeof validateReportOutput>;
  fallbackMessages: string[];
  eventType?: string;
  sourceGameTimeMinutes: number;
  sourceStateVersion: number;
};

export type EngineLoopState = {
  simAccumulatorMinutes: number;
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
  activeReportModal: Report | null;
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
  dismissActiveReport: () => void;
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

function createPendingAgentState(): PendingAgentState {
  return {
    french: { status: "idle", lastRunMinutes: 0, pending: false },
    german: { status: "idle", lastRunMinutes: 0, pending: false },
    director: { status: "idle", lastRunMinutes: 0, pending: false },
    reporter: { status: "idle", lastRunMinutes: 0, pending: false }
  };
}

export function createLoopState(): EngineLoopState {
  return {
    simAccumulatorMinutes: 0,
    combatAccumulatorMinutes: 0,
    reportAccumulatorMinutes: 0
  };
}

function pushReport(state: GameState, report: Omit<Report, "id" | "createdAtMinutes">): Report {
  const created = {
    id: makeId("report"),
    createdAtMinutes: state.currentTimeMinutes,
    ...report
  };
  state.reports.unshift(created);
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

  return created;
}

function appendFallbackReport(state: GameState, details: string): void {
  pushReport(state, {
    headline: "AI fallback used",
    reportText: details,
    advisorLine: "Simulation continued using validated mock decision path.",
    eventType: "ai_fallback"
  });
}

function appendStaleResultReport(state: GameState, agentName: string, sourceGameTimeMinutes: number): void {
  pushReport(state, {
    headline: `${agentName} result rejected`,
    reportText: `Returned result from minute ${sourceGameTimeMinutes} was rejected as stale against the live simulation state.`,
    advisorLine: "Independent agent cycles continue without replaying stale decisions.",
    eventType: "stale_result"
  });
}

function bumpStateVersion(state: GameState): void {
  state.stateVersion += 1;
}

function updateLocalContact(state: GameState): void {
  for (const node of state.nodes) {
    const alliedFront = state.units.some(
      (unit) => unit.side === "allied" && unit.role === "front" && unit.nodeId === node.id && unit.strength > 0
    );
    const germanFront = state.units.some(
      (unit) => unit.side === "german" && unit.role === "front" && unit.nodeId === node.id && unit.strength > 0
    );
    if (alliedFront && germanFront) node.control = "contested";
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

function maybeNeedsDirectorDecision(state: GameState, recentEvents: string[]): boolean {
  if (state.parisThreat > GAME_CONFIG.governmentDecisionParisThreatThreshold) return true;
  if (state.politicalPressure > GAME_CONFIG.governmentDecisionPoliticalPressureThreshold) return true;
  if (state.cityStability < GAME_CONFIG.governmentDecisionCityStabilityMin) return true;
  if (state.governmentCollapseRisk > GAME_CONFIG.governmentDecisionCollapseRiskThreshold) return true;
  if (state.invalidCommandsInLast6Hours >= GAME_CONFIG.governmentDecisionInvalidCommandsThreshold) return true;
  return recentEvents.some((event) => event.toLowerCase().includes("crisis"));
}

function mergeRecentEvents(existing: string[], additions: string[]): string[] {
  return [...existing, ...additions].slice(-24);
}

function deriveAiStatusText(pending: PendingAgentState): string | null {
  const active = Object.entries(pending)
    .filter(([, value]) => value.pending)
    .map(([key]) => key);
  if (active.length === 0) return null;
  return `${active.join(", ")} agent${active.length > 1 ? "s" : ""} pending`;
}

function isAgentResultStale(
  game: GameState,
  sourceGameTimeMinutes: number,
  sourceStateVersion: number
): boolean {
  const minuteLag = game.currentTimeMinutes - sourceGameTimeMinutes;
  const versionLag = game.stateVersion - sourceStateVersion;
  return minuteLag > GAME_CONFIG.agentDecisionStalenessTreshold || versionLag > 12;
}

function markAgentPending(
  pendingState: PendingAgentState,
  key: keyof PendingAgentState,
  currentTimeMinutes: number
): PendingAgentState {
  return {
    ...pendingState,
    [key]: {
      status: "pending",
      pending: true,
      lastRunMinutes: currentTimeMinutes
    }
  };
}

function markAgentResolved(pendingState: PendingAgentState, key: keyof PendingAgentState): PendingAgentState {
  return {
    ...pendingState,
    [key]: {
      ...pendingState[key],
      status: "idle",
      pending: false
    }
  };
}

function runSimStep(state: GameState): PublicEvent[] {
  const moveEvents = advanceMovingUnits(state, SIM_STEP_GAME_MINUTES);
  applyNoOpDrift(state);
  updateLocalContact(state);
  state.currentTimeMinutes += SIM_STEP_GAME_MINUTES;
  state.parisThreat = calculateParisThreat(state);
  updateSustainedThreatTimers(state, SIM_STEP_GAME_MINUTES);
  bumpStateVersion(state);
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
  bumpStateVersion(state);
  return { events, publicEvents, majorCombats: combats.filter((combat) => combat.major) };
}

async function resolveFrenchCommandBundle(
  snapshotState: GameState,
  commands: PlayerCommandIntent[],
  recentEvents: string[]
): Promise<FrenchCommandBundle> {
  const snapshot = cloneAndClampState(snapshotState);
  const eventLabels: string[] = [];
  const fallbackMessages: string[] = [];
  const parserResults = await Promise.all(
    commands.map((command) =>
      getFrenchCommandDecision(
        buildFrenchCommandContext(snapshot, command.rawText, command.selectedNodeId, command.selectedUnitId, recentEvents)
      )
    )
  );

  const parserOutputs = parserResults.map((parserResult) => {
    if (parserResult.usedFallback) {
      fallbackMessages.push(parserResult.error ?? "French command parser AI failed");
      eventLabels.push("AI fallback used");
    }
    const safeOutput = validateFrenchParserOutput(snapshot, parserResult.output);
    eventLabels.push(`Player order parsed: ${safeOutput.action}`);
    return safeOutput;
  });

  return {
    parserOutputs,
    eventLabels,
    fallbackMessages,
    sourceGameTimeMinutes: snapshot.currentTimeMinutes,
    sourceStateVersion: snapshot.stateVersion
  };
}

async function resolveGermanIntentBundle(
  snapshotState: GameState,
  recentEvents: string[]
): Promise<GermanIntentBundle> {
  const snapshot = cloneAndClampState(snapshotState);
  const fallbackMessages: string[] = [];
  const germanDecision = await getGermanCommanderDecision(buildGermanCommanderContext(snapshot, recentEvents));
  if (germanDecision.usedFallback) {
    fallbackMessages.push(germanDecision.error ?? "German commander AI failed");
  }
  const safeGerman = validateGermanOutput(snapshot, germanDecision.output);
  const germanResult = applyGermanIntent(snapshot, safeGerman);
  return {
    germanOutput: safeGerman,
    eventLabel: germanResult.event,
    publicEvent: germanResult.publicEvent,
    fallbackMessages,
    sourceGameTimeMinutes: snapshot.currentTimeMinutes,
    sourceStateVersion: snapshot.stateVersion
  };
}

async function resolveDirectorBundle(
  snapshotState: GameState,
  recentEvents: string[],
  eventType: "periodic" | "combat" | "crisis" | "movement" | "logistics",
  combatContext?: { nodeId: MapNodeId; alliedLoss: number; germanLoss: number }
): Promise<DirectorBundle> {
  const snapshot = cloneAndClampState(snapshotState);
  const fallbackMessages: string[] = [];
  const decision = await getDirectorDecision(buildDirectorContext(snapshot, { eventType, recentEvents, combatContext }));
  if (decision.usedFallback) {
    fallbackMessages.push(decision.error ?? "Director AI failed");
  }
  const output = validateDirectorOutput(decision.output);
  return {
    output,
    fallbackMessages,
    eventLabels: output.trigger ? [`Director event: ${output.action}`] : [],
    sourceGameTimeMinutes: snapshot.currentTimeMinutes,
    sourceStateVersion: snapshot.stateVersion
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
  const report = validateReportOutput(reportDecision.output);
  return {
    report,
    fallbackMessages,
    eventType: publicEvents[publicEvents.length - 1]?.type ?? "periodic",
    sourceGameTimeMinutes: snapshot.currentTimeMinutes,
    sourceStateVersion: snapshot.stateVersion
  };
}

function applyFrenchOrderBundleToGame(game: GameState, bundle: FrenchCommandBundle): string[] {
  for (const output of bundle.parserOutputs) {
    game.orderQueue.push(createOrderFromParserOutput(output, game.currentTimeMinutes, game));
  }
  if (bundle.parserOutputs.length > 0) bumpStateVersion(game);
  bundle.fallbackMessages.forEach((message) => appendFallbackReport(game, message));
  return bundle.eventLabels;
}

function applyGermanIntentBundleToGame(
  game: GameState,
  bundle: GermanIntentBundle
): { events: string[]; publicEvents: PublicEvent[] } {
  bundle.fallbackMessages.forEach((message) => appendFallbackReport(game, message));
  const germanResult = applyGermanIntent(game, bundle.germanOutput);
  bumpStateVersion(game);
  return { events: [germanResult.event], publicEvents: [germanResult.publicEvent] };
}

function applyDirectorBundleToGame(
  game: GameState,
  bundle: DirectorBundle
): { events: string[]; publicEvents: PublicEvent[] } {
  bundle.fallbackMessages.forEach((message) => appendFallbackReport(game, message));
  const output = bundle.output;
  if (!output.trigger) return { events: [], publicEvents: [] };

  game.cityStability = clamp(game.cityStability + output.stateDelta.cityStability);
  game.politicalPressure = clamp(game.politicalPressure + output.stateDelta.politicalPressure);
  game.commandCohesion = clamp(game.commandCohesion + output.stateDelta.commandCohesion);
  game.governmentCollapseRisk = clamp(game.governmentCollapseRisk + output.stateDelta.governmentCollapseRisk);
  game.alliedOperationalMomentum = clamp(game.alliedOperationalMomentum + output.stateDelta.alliedOperationalMomentum);
  game.germanOperationalMomentum = clamp(game.germanOperationalMomentum + output.stateDelta.germanOperationalMomentum);
  game.railwayCongestion = clamp(game.railwayCongestion + output.stateDelta.railwayCongestion);
  game.shortTermRedeployDelayMinutes += output.stateDelta.shortTermRedeployDelayMinutes;

  output.unitDelta.forEach((delta) => {
    const unit = game.units.find((item) => item.id === delta.unitId);
    if (!unit) return;
    unit.strength = Math.max(0, unit.strength * (1 + delta.strengthDeltaPct));
    unit.morale = clamp(unit.morale + delta.moraleDelta);
    unit.fatigue = clamp(unit.fatigue + delta.fatigueDelta);
    unit.supply = clamp(unit.supply + delta.supplyDelta);
    unit.cohesion = clamp(unit.cohesion + delta.cohesionDelta);
    unit.readiness = clamp(unit.readiness + delta.readinessDelta);
  });

  output.nodeDelta.forEach((delta) => {
    const node = game.nodes.find((item) => item.id === delta.nodeId);
    if (!node) return;
    node.controlPressure = clamp((node.controlPressure ?? 0) + delta.controlPressureDelta, -100, 100);
    node.defenseValue = Math.max(0, node.defenseValue + delta.defenseValueDelta);
    node.supplyValue = Math.max(0, node.supplyValue + delta.supplyValueDelta);
    node.transportValue = Math.max(0, node.transportValue + delta.transportValueDelta);
  });

  bumpStateVersion(game);
  return {
    events: bundle.eventLabels,
    publicEvents: [
      {
        type: "director_decision",
        nodeId: output.nodeDelta[0]?.nodeId,
        unitIds: output.unitDelta.map((delta) => delta.unitId),
        resultSummary: output.publicMessage
      }
    ]
  };
}

function applyReportBundleToGame(game: GameState, bundle: ReportBundle): Report | null {
  bundle.fallbackMessages.forEach((message) => appendFallbackReport(game, message));
  if (!bundle.report.shouldReport) return null;
  const report = pushReport(game, {
    headline: bundle.report.headline,
    reportText: bundle.report.reportText,
    advisorLine: bundle.report.advisorLine,
    knowledgeHint: bundle.report.knowledgeHint,
    eventType: bundle.eventType
  });
  bumpStateVersion(game);
  return report;
}

export const useGameStore = create<GameStore>((set, get) => {
  const launchFrenchCycle = (
    snapshotState: GameState,
    commands: PlayerCommandIntent[],
    recentEvents: string[],
    sessionId: number
  ) => {
    void resolveFrenchCommandBundle(snapshotState, commands, recentEvents)
      .then((bundle) => {
        const current = get();
        if (current.sessionId !== sessionId) return;
        set((prev) => {
          if (prev.sessionId !== sessionId) return prev;
          const game = cloneAndClampState(prev.game);
          const pendingAgentState = markAgentResolved(prev.game.pendingAgentState, "french");
          if (isAgentResultStale(game, bundle.sourceGameTimeMinutes, bundle.sourceStateVersion)) {
            appendStaleResultReport(game, "FrenchCommandParser", bundle.sourceGameTimeMinutes);
            return { game: { ...game, pendingAgentState }, aiStatusText: deriveAiStatusText(pendingAgentState) };
          }
          const events = applyFrenchOrderBundleToGame(game, bundle);
          return {
            game: { ...game, pendingAgentState },
            recentEvents: mergeRecentEvents(prev.recentEvents, events),
            aiStatusText: deriveAiStatusText(pendingAgentState)
          };
        });
      })
      .catch((error) => {
        set((prev) => {
          if (prev.sessionId !== sessionId) return prev;
          const game = cloneAndClampState(prev.game);
          appendFallbackReport(game, error instanceof Error ? error.message : String(error));
          const pendingAgentState = markAgentResolved(prev.game.pendingAgentState, "french");
          return { game: { ...game, pendingAgentState }, aiStatusText: deriveAiStatusText(pendingAgentState) };
        });
      });
  };

  const launchGermanCycle = (snapshotState: GameState, recentEvents: string[], sessionId: number) => {
    void resolveGermanIntentBundle(snapshotState, recentEvents)
      .then((bundle) => {
        const current = get();
        if (current.sessionId !== sessionId) return;
        let auditLines: string[] = [];
        set((prev) => {
          if (prev.sessionId !== sessionId) return prev;
          const game = cloneAndClampState(prev.game);
          const pendingAgentState = markAgentResolved(prev.game.pendingAgentState, "german");
          if (isAgentResultStale(game, bundle.sourceGameTimeMinutes, bundle.sourceStateVersion)) {
            appendStaleResultReport(game, "GermanCommander", bundle.sourceGameTimeMinutes);
            return { game: { ...game, pendingAgentState }, aiStatusText: deriveAiStatusText(pendingAgentState) };
          }
          const applied = applyGermanIntentBundleToGame(game, bundle);
          auditLines = buildAuditLinesFromPublicEvents(game, applied.publicEvents);
          return {
            game: { ...game, pendingAgentState },
            recentEvents: mergeRecentEvents(prev.recentEvents, applied.events),
            aiStatusText: deriveAiStatusText(pendingAgentState)
          };
        });
        void postActionAuditLines(auditLines).catch(() => undefined);
      })
      .catch((error) => {
        set((prev) => {
          if (prev.sessionId !== sessionId) return prev;
          const game = cloneAndClampState(prev.game);
          appendFallbackReport(game, error instanceof Error ? error.message : String(error));
          const pendingAgentState = markAgentResolved(prev.game.pendingAgentState, "german");
          return { game: { ...game, pendingAgentState }, aiStatusText: deriveAiStatusText(pendingAgentState) };
        });
      });
  };

  const launchDirectorCycle = (
    snapshotState: GameState,
    recentEvents: string[],
    sessionId: number,
    eventType: "periodic" | "combat" | "crisis" | "movement" | "logistics",
    combatContext?: { nodeId: MapNodeId; alliedLoss: number; germanLoss: number }
  ) => {
    void resolveDirectorBundle(snapshotState, recentEvents, eventType, combatContext)
      .then((bundle) => {
        const current = get();
        if (current.sessionId !== sessionId) return;
        let auditLines: string[] = [];
        set((prev) => {
          if (prev.sessionId !== sessionId) return prev;
          const game = cloneAndClampState(prev.game);
          const pendingAgentState = markAgentResolved(prev.game.pendingAgentState, "director");
          if (isAgentResultStale(game, bundle.sourceGameTimeMinutes, bundle.sourceStateVersion)) {
            appendStaleResultReport(game, "Director", bundle.sourceGameTimeMinutes);
            return { game: { ...game, pendingAgentState }, aiStatusText: deriveAiStatusText(pendingAgentState) };
          }
          const applied = applyDirectorBundleToGame(game, bundle);
          auditLines = buildAuditLinesFromPublicEvents(game, applied.publicEvents);
          return {
            game: { ...game, pendingAgentState },
            recentEvents: mergeRecentEvents(prev.recentEvents, applied.events),
            aiStatusText: deriveAiStatusText(pendingAgentState)
          };
        });
        void postActionAuditLines(auditLines).catch(() => undefined);
      })
      .catch((error) => {
        set((prev) => {
          if (prev.sessionId !== sessionId) return prev;
          const game = cloneAndClampState(prev.game);
          appendFallbackReport(game, error instanceof Error ? error.message : String(error));
          const pendingAgentState = markAgentResolved(prev.game.pendingAgentState, "director");
          return { game: { ...game, pendingAgentState }, aiStatusText: deriveAiStatusText(pendingAgentState) };
        });
      });
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
        if (current.sessionId !== sessionId) return;
        set((prev) => {
          if (prev.sessionId !== sessionId) return prev;
          const game = cloneAndClampState(prev.game);
          const pendingAgentState = markAgentResolved(prev.game.pendingAgentState, "reporter");
          if (isAgentResultStale(game, bundle.sourceGameTimeMinutes, bundle.sourceStateVersion)) {
            appendStaleResultReport(game, "Reporter", bundle.sourceGameTimeMinutes);
            return { game: { ...game, pendingAgentState }, aiStatusText: deriveAiStatusText(pendingAgentState) };
          }
          const report = applyReportBundleToGame(game, bundle);
          return {
            game: { ...game, pendingAgentState },
            activeReportModal: report ?? prev.activeReportModal,
            isPaused: report ? true : prev.isPaused,
            aiStatusText: deriveAiStatusText(pendingAgentState)
          };
        });
      })
      .catch((error) => {
        set((prev) => {
          if (prev.sessionId !== sessionId) return prev;
          const game = cloneAndClampState(prev.game);
          appendFallbackReport(game, error instanceof Error ? error.message : String(error));
          const pendingAgentState = markAgentResolved(prev.game.pendingAgentState, "reporter");
          return { game: { ...game, pendingAgentState }, aiStatusText: deriveAiStatusText(pendingAgentState) };
        });
      });
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
    activeReportModal: null,
    sessionId: 1,

    enqueueCommand: (text) => {
      const trimmed = text.trim().slice(0, 160);
      if (!trimmed || get().ending) return;
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

        set((prev) => {
          const game = cloneAndClampState(prev.game);
          const loopState = { ...prev.loopState };
          let recentEvents = [...prev.recentEvents];
          let latestPublicEvents: PublicEvent[] = [];

          if (prev.selectedNodeId) {
            maybeDiscoverParisTransport(game, prev.selectedNodeId);
          }

          loopState.simAccumulatorMinutes += minutes;
          loopState.combatAccumulatorMinutes += minutes;
          loopState.reportAccumulatorMinutes += minutes;

          while (loopState.simAccumulatorMinutes >= SIM_STEP_GAME_MINUTES && !game.gameEnded) {
            loopState.simAccumulatorMinutes -= SIM_STEP_GAME_MINUTES;
            const simPublicEvents = runSimStep(game);
            const stepEvents = simPublicEvents.map((event) => event.resultSummary);
            latestPublicEvents = [...simPublicEvents];

            const orderOutcome = processOrders(game);
            stepEvents.push(...orderOutcome.events);
            latestPublicEvents = [...latestPublicEvents, ...orderOutcome.publicEvents];
            void postActionAuditLines(buildAuditLinesFromPublicEvents(game, orderOutcome.publicEvents)).catch(() => undefined);

            if (loopState.combatAccumulatorMinutes >= COMBAT_STEP_GAME_MINUTES) {
              loopState.combatAccumulatorMinutes -= COMBAT_STEP_GAME_MINUTES;
              const combat = runCombatStep(game);
              stepEvents.push(...combat.events);
              latestPublicEvents = [...latestPublicEvents, ...combat.publicEvents];

              if (combat.majorCombats.length > 0 && !game.pendingAgentState.director.pending) {
                const majorCombat = combat.majorCombats[0];
                game.pendingAgentState = markAgentPending(game.pendingAgentState, "director", game.currentTimeMinutes);
                launchDirectorCycle(
                  game,
                  recentEvents,
                  prev.sessionId,
                  "combat",
                  {
                    nodeId: majorCombat.nodeId,
                    alliedLoss: majorCombat.alliedLoss,
                    germanLoss: majorCombat.germanLoss
                  }
                );
              }
            }

            recentEvents = mergeRecentEvents(recentEvents, stepEvents);
            if (game.currentTimeMinutes >= TOTAL_GAME_HOURS * 60 || shouldEndGame(game)) {
              game.gameEnded = true;
              break;
            }
          }

          const transmission = calculateTransmissionEfficiency({
            parisThreat: game.parisThreat,
            commandCohesion: game.commandCohesion,
            cityStability: game.cityStability,
            politicalPressure: game.politicalPressure,
            railwayCongestion: game.railwayCongestion
          });

          let pendingCommands = prev.pendingCommands;
          if (
            pendingCommands.length > 0 &&
            !game.pendingAgentState.french.pending &&
            game.currentTimeMinutes - game.pendingAgentState.french.lastRunMinutes >=
              transmission.frenchCommandProcessingIntervalMinutes
          ) {
            const commandsForDecision = [...pendingCommands];
            pendingCommands = [];
            game.pendingAgentState = markAgentPending(game.pendingAgentState, "french", game.currentTimeMinutes);
            launchFrenchCycle(game, commandsForDecision, recentEvents, prev.sessionId);
          }

          if (
            !game.pendingAgentState.german.pending &&
            game.currentTimeMinutes - game.pendingAgentState.german.lastRunMinutes >= transmission.germanDecisionIntervalMinutes
          ) {
            game.pendingAgentState = markAgentPending(game.pendingAgentState, "german", game.currentTimeMinutes);
            launchGermanCycle(game, recentEvents, prev.sessionId);
          }

          const shouldRunDirectorPeriodically =
            game.currentTimeMinutes - game.pendingAgentState.director.lastRunMinutes >= GAME_CONFIG.directorCycleMinutes;
          const shouldRunDirectorForCrisis = maybeNeedsDirectorDecision(game, recentEvents);
          if (!game.pendingAgentState.director.pending && (shouldRunDirectorPeriodically || shouldRunDirectorForCrisis)) {
            game.pendingAgentState = markAgentPending(game.pendingAgentState, "director", game.currentTimeMinutes);
            launchDirectorCycle(game, recentEvents, prev.sessionId, shouldRunDirectorForCrisis ? "crisis" : "periodic");
          }

          if (
            !game.pendingAgentState.reporter.pending &&
            game.currentTimeMinutes - game.pendingAgentState.reporter.lastRunMinutes >= REPORT_MIN_INTERVAL_GAME_MINUTES
          ) {
            const publicEvents =
              latestPublicEvents.length > 0
                ? latestPublicEvents
                : [
                    {
                      type: "periodic",
                      resultSummary: `Paris threat ${Math.round(game.parisThreat)}; cohesion ${Math.round(game.commandCohesion)}; rail congestion ${Math.round(game.railwayCongestion)}.`
                    }
                  ];
            game.pendingAgentState = markAgentPending(game.pendingAgentState, "reporter", game.currentTimeMinutes);
            loopState.reportAccumulatorMinutes = 0;
            launchReportCycle(game, publicEvents, prev.reportTone, prev.sessionId);
          }

          const ended = game.gameEnded || game.currentTimeMinutes >= TOTAL_GAME_HOURS * 60 || shouldEndGame(game);
          if (ended) game.gameEnded = true;

          return {
            game,
            loopState,
            recentEvents,
            pendingCommands,
            isTickRunning: false,
            ending: ended ? resolveEnding(game) : prev.ending,
            aiStatusText: deriveAiStatusText(game.pendingAgentState)
          };
        });
      } catch (error) {
        console.error("runTick failed", error);
        set(() => ({ isTickRunning: false }));
      }
    },

    togglePause: () => set((prev) => ({ isPaused: !prev.isPaused })),
    decreaseSpeed: () => set((prev) => ({ speedLevel: nextSpeed(prev.speedLevel, -1) })),
    increaseSpeed: () => set((prev) => ({ speedLevel: nextSpeed(prev.speedLevel, 1) })),
    setReportTone: (tone) => set(() => ({ reportTone: tone })),
    selectNode: (nodeId) => set(() => ({ selectedNodeId: nodeId })),
    closeNode: () => set(() => ({ selectedNodeId: null })),
    selectUnit: (unitId) => set(() => ({ selectedUnitId: unitId })),

    mobilizeCityVehicles: () => {
      if (get().ending) return;
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
      set((prev) => ({
        pendingCommands: [
          ...prev.pendingCommands,
          {
            rawText: `Redeploy nearest reserve toward ${state.selectedNodeId}.`,
            selectedNodeId: prev.selectedNodeId ?? undefined,
            selectedUnitId: prev.selectedUnitId ?? undefined
          }
        ]
      }));
    },

    dismissActiveReport: () => {
      set((prev) => ({
        activeReportModal: null,
        isPaused: false
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
        activeReportModal: null,
        sessionId: prev.sessionId + 1
      }));
    },

    demoAdvanceHours: (hours) => {
      if (!Number.isFinite(hours) || hours <= 0) return;
      set((prev) => {
        const game = cloneAndClampState(prev.game);
        game.currentTimeMinutes += Math.round(hours * 60);
        bumpStateVersion(game);
        return { game };
      });
    },

    demoPushReport: (headline, reportText, advisorLine, eventType = "demo") => {
      set((prev) => {
        const game = cloneAndClampState(prev.game);
        const report = pushReport(game, {
          headline: headline.slice(0, 120),
          reportText: reportText.slice(0, 450),
          advisorLine: advisorLine?.slice(0, 180),
          eventType
        });
        bumpStateVersion(game);
        return {
          game,
          activeReportModal: report,
          isPaused: true,
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
        bumpStateVersion(game);
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
      set((prev) => ({
        aiStatusText: status,
        game: {
          ...prev.game,
          pendingAgentState: pending ? markAgentPending(prev.game.pendingAgentState, "director", prev.game.currentTimeMinutes) : createPendingAgentState()
        }
      }));
    },

    demoClearPendingCommands: () => set(() => ({ pendingCommands: [] }))
  };
});

export type { SpeedLevel };
