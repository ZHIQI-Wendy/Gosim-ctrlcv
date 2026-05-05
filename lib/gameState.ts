"use client";

import { create } from "zustand";
import {
  AgentLine,
  BattleReport,
  CityId,
  GameStateData,
  KnowledgeCard,
  OrderItem,
  StrategicFocus
} from "@/types";
import { classifyCommand } from "@/lib/commandClassifier";
import { aiTick } from "@/lib/aiTick";
import { formatCampaignTime } from "@/lib/time";

export type SpeedLevel = "SLOW" | "NORMAL" | "FAST";

const REAL_SECONDS_PER_GAME_HOUR = 6;
const COMMAND_BATCH_EVERY_GAME_HOURS = 0.5;
const COMMANDS_PER_BATCH = 1;
const SPEED_LEVELS: SpeedLevel[] = ["SLOW", "NORMAL", "FAST"];

const SPEED_MULTIPLIER: Record<SpeedLevel, number> = {
  SLOW: 0.5,
  NORMAL: 1,
  FAST: 2
};

const initialGameState: GameStateData = {
  timeLeft: 48,
  currentTime: Date.UTC(1914, 8, 5, 18, 0, 0),
  parisThreat: 72,
  germanAdvance: 68,
  flankGap: 15,
  morale: 55,
  fatigue: 60,
  supply: 65,
  railwayCongestion: 70,
  redeployEfficiency: 100,
  cityStability: 65,
  cityVehiclesDiscovered: false,
  cityVehiclesUsed: false,
  politicalPressure: 60,
  commandCohesion: 70,
  counterattackMomentum: 0,
  counterattackSuccess: false,
  pendingRailOptimizationTicks: 0,
  outcomeScores: {
    miracleMarne: 0,
    logisticsMaster: 0,
    tacticalGamble: 0,
    costlyStalemate: 0,
    parisPoliticalCrisis: 0,
    germanBreakthrough: 0,
    ahistoricalCollapse: 0
  },
  ending: null
};

function cloneInitial(): GameStateData {
  return {
    ...initialGameState,
    outcomeScores: { ...initialGameState.outcomeScores }
  };
}

function makeReport(tick: number, title: string, body: string, timeLeftHours: number): BattleReport {
  return {
    id: `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tick,
    title,
    body,
    dateLabel: formatCampaignTime(timeLeftHours)
  };
}

function clampSpeedLevel(level: SpeedLevel, direction: -1 | 1): SpeedLevel {
  const nextIndex = Math.min(
    SPEED_LEVELS.length - 1,
    Math.max(0, SPEED_LEVELS.indexOf(level) + direction)
  );
  return SPEED_LEVELS[nextIndex];
}

interface GameStore {
  game: GameStateData;
  orderQueue: OrderItem[];
  reports: BattleReport[];
  cards: KnowledgeCard[];
  agentLines: AgentLine[];
  selectedFocus: StrategicFocus;
  selectedCity: CityId | null;
  isPaused: boolean;
  speedLevel: SpeedLevel;
  gameHoursUntilNextBatch: number;
  tick: number;
  enqueueCommand: (text: string) => void;
  runTick: (realSecondsElapsed: number) => void;
  togglePause: () => void;
  decreaseSpeed: () => void;
  increaseSpeed: () => void;
  setFocus: (focus: StrategicFocus) => void;
  selectCity: (city: CityId) => void;
  closeCityPopup: () => void;
  mobilizeCityVehicles: () => void;
  dispatchCityForces: () => void;
  reset: () => void;
}

function getGameHoursFromRealSeconds(realSecondsElapsed: number, speedLevel: SpeedLevel): number {
  const gameHoursPerRealSecond = (1 / REAL_SECONDS_PER_GAME_HOUR) * SPEED_MULTIPLIER[speedLevel];
  return realSecondsElapsed * gameHoursPerRealSecond;
}

export const useGameStore = create<GameStore>((set, get) => {
  const runSimulationStep = (gameHoursElapsed: number, force = false) => {
    const state = get();
    if (state.game.ending) return;
    if (state.isPaused && !force) return;

    const nextTick = state.tick + 1;

    const accumulatedGameHours = state.gameHoursUntilNextBatch + gameHoursElapsed;
    const batchCount = Math.floor(accumulatedGameHours / COMMAND_BATCH_EVERY_GAME_HOURS);
    const orderSlots = batchCount * COMMANDS_PER_BATCH;
    const remainingGameHours = accumulatedGameHours - batchCount * COMMAND_BATCH_EVERY_GAME_HOURS;

    const result = aiTick(state.game, state.orderQueue, nextTick, {
      gameHoursDelta: gameHoursElapsed,
      orderSlots
    });

    const knownCardKeys = new Set(state.cards.map((card) => card.key));
    const newCards = result.artifacts.cards.filter((card) => !knownCardKeys.has(card.key));

    set(() => ({
      tick: nextTick,
      gameHoursUntilNextBatch: remainingGameHours,
      game: result.nextState,
      orderQueue: state.orderQueue.filter((order) => !result.consumedOrders.includes(order.id)),
      reports: [...result.artifacts.reports, ...state.reports].slice(0, 40),
      cards: [...newCards, ...state.cards].slice(0, 12),
      agentLines: [...result.artifacts.agentLines, ...state.agentLines].slice(0, 24)
    }));
  };

  return {
    game: cloneInitial(),
    orderQueue: [],
    reports: [
      {
        id: "intro-report",
        tick: 0,
        title: "Paris Emergency Window",
        body: "Paris is under threat.",
        dateLabel: formatCampaignTime(48)
      }
    ],
    cards: [],
    agentLines: [
      {
        id: "intro-line",
        speaker: "Adviser",
        text: "Clock reset complete: each 6 real seconds advance one game hour at normal speed."
      }
    ],
    selectedFocus: "DEFEND_PARIS",
    selectedCity: null,
    isPaused: false,
    speedLevel: "NORMAL",
    gameHoursUntilNextBatch: 0,
    tick: 0,

    enqueueCommand: (text) => {
      const state = get();
      if (state.game.ending) return;

      const safeText = text.trim().slice(0, 120);
      const command = classifyCommand(state.selectedFocus, safeText);
      const order: OrderItem = {
        id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: Date.now(),
        command
      };

      const queueBody = safeText
        ? `Strategic focus ${state.selectedFocus} accepted with note: "${safeText}".`
        : `Strategic focus ${state.selectedFocus} accepted without extra note.`;

      set((prev) => ({
        orderQueue: [...prev.orderQueue, order],
        reports: [makeReport(prev.tick, "Command Received", queueBody, prev.game.timeLeft), ...prev.reports].slice(0, 40)
      }));
    },

    runTick: (realSecondsElapsed) => {
      const state = get();
      const gameHoursElapsed = getGameHoursFromRealSeconds(realSecondsElapsed, state.speedLevel);
      runSimulationStep(gameHoursElapsed, false);
    },

    togglePause: () => {
      set((prev) => ({ isPaused: !prev.isPaused }));
    },

    decreaseSpeed: () => {
      set((prev) => ({ speedLevel: clampSpeedLevel(prev.speedLevel, -1) }));
    },

    increaseSpeed: () => {
      set((prev) => ({ speedLevel: clampSpeedLevel(prev.speedLevel, 1) }));
    },

    setFocus: (focus) => set(() => ({ selectedFocus: focus })),

    selectCity: (city) => {
      const state = get();
      const shouldDiscover = city === "paris" && state.game.parisThreat > 72 && !state.game.cityVehiclesDiscovered;

      if (!shouldDiscover) {
        set(() => ({ selectedCity: city }));
        return;
      }

      set((prev) => ({
        selectedCity: city,
        game: {
          ...prev.game,
          cityVehiclesDiscovered: true
        },
        reports: [
          makeReport(
            prev.tick,
            "Urban Transport Note",
            "Paris transport remains operational, mostly for civilian commuting.",
            prev.game.timeLeft
          ),
          ...prev.reports
        ].slice(0, 40)
      }));
    },

    closeCityPopup: () => set(() => ({ selectedCity: null })),

    mobilizeCityVehicles: () => {
      const state = get();
      if (!state.game.cityVehiclesDiscovered || state.game.cityVehiclesUsed || state.game.ending) return;

      set((prev) => ({
        game: {
          ...prev.game,
          cityVehiclesUsed: true,
          parisThreat: Math.max(0, prev.game.parisThreat - 20),
          morale: Math.min(100, prev.game.morale + 10),
          cityStability: Math.max(0, prev.game.cityStability - 8),
          supply: Math.min(100, prev.game.supply + 6),
          outcomeScores: {
            ...prev.game.outcomeScores,
            miracleMarne: Math.min(100, prev.game.outcomeScores.miracleMarne + 20)
          }
        },
        cards: [
          {
            id: `city-${Date.now()}`,
            key: "city-vehicles",
            title: "Taxis of the Marne",
            body: "In September 1914, Paris taxis moved troops toward the front and became a symbol of civic mobilization."
          },
          ...prev.cards.filter((card) => card.key !== "city-vehicles")
        ],
        reports: [
          makeReport(
            prev.tick,
            "City Requisition Approved",
            "Civilian vehicles were requisitioned for emergency troop transfer and rapid local support.",
            prev.game.timeLeft
          ),
          ...prev.reports
        ].slice(0, 40)
      }));
    },

    dispatchCityForces: () => {
      const state = get();
      if (!state.selectedCity || state.game.ending) return;
      const city = state.selectedCity;

      const cityFocus: Record<CityId, StrategicFocus> = {
        paris: "DEFEND_PARIS",
        meaux: "COUNTER_STRIKE",
        chateauThierry: "COUNTER_STRIKE",
        marne: "COUNTER_STRIKE",
        verdun: "DELAY_GERMANS",
        reims: "BOOST_RECON"
      };

      const focus = cityFocus[city];
      const command = classifyCommand(focus, `Dispatch reserve from ${city}`);
      const order: OrderItem = {
        id: `city-order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: Date.now(),
        command
      };

      set((prev) => ({
        selectedFocus: focus,
        orderQueue: [...prev.orderQueue, order],
        reports: [
          makeReport(
            prev.tick,
            "City Dispatch Ordered",
            `${city.toUpperCase()} command node redirected reserve and transport assets to active sectors.`,
            prev.game.timeLeft
          ),
          ...prev.reports
        ].slice(0, 40)
      }));
    },

    reset: () =>
      set(() => ({
        game: cloneInitial(),
        orderQueue: [],
        reports: [
          {
            id: "intro-report-reset",
            tick: 0,
            title: "Paris Emergency Window",
            body: "Paris is under threat.",
            dateLabel: formatCampaignTime(48)
          }
        ],
        cards: [],
        agentLines: [
          {
            id: "intro-line-reset",
            speaker: "Adviser",
            text: "The front is unstable, but you still control strategic direction."
          }
        ],
        selectedFocus: "DEFEND_PARIS",
        selectedCity: null,
        isPaused: false,
        speedLevel: "NORMAL",
        gameHoursUntilNextBatch: 0,
        tick: 0
      }))
  };
});
