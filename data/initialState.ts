import { GameState, Unit } from "@/types";
import { MAP_EDGE_LIST } from "@/data/mapEdges";
import { MAP_NODE_LIST } from "@/data/mapNodes";

export const START_TIME = "1914-09-05T18:00:00";
export const END_TIME = "1914-09-07T18:00:00";
export const TOTAL_GAME_HOURS = 48;

export const FRAME_INTERVAL_SECONDS = 0.05;
export const GAME_MINUTES_PER_REAL_SECOND = 10;

export const SIM_STEP_GAME_MINUTES = 10;
export const DECISION_STEP_GAME_MINUTES = 60;
export const COMBAT_STEP_GAME_MINUTES = 60;
export const REPORT_MIN_INTERVAL_GAME_MINUTES = 120;

const INITIAL_UNITS: Unit[] = [
  {
    id: "paris_garrison",
    side: "allied",
    name: "Paris Garrison",
    nodeId: "paris",
    strength: 35,
    role: "rear",
    stance: "hold",
    morale: 62,
    fatigue: 20,
    supply: 70,
    cohesion: 65,
    readiness: 55,
    entrenchment: 45,
    momentum: 20
  },
  {
    id: "sixth_army",
    side: "allied",
    name: "Sixth Army",
    nodeId: "paris_rail_hub",
    strength: 150,
    role: "reserve",
    stance: "hold",
    morale: 68,
    fatigue: 35,
    supply: 72,
    cohesion: 68,
    readiness: 62,
    entrenchment: 20,
    momentum: 35
  },
  {
    id: "fifth_army",
    side: "allied",
    name: "Fifth Army",
    nodeId: "marne_crossings",
    strength: 180,
    role: "front",
    stance: "hold",
    morale: 64,
    fatigue: 58,
    supply: 61,
    cohesion: 62,
    readiness: 56,
    entrenchment: 35,
    momentum: 30
  },
  {
    id: "ninth_army",
    side: "allied",
    name: "Ninth Army",
    nodeId: "montmirail",
    strength: 120,
    role: "front",
    stance: "hold",
    morale: 63,
    fatigue: 55,
    supply: 60,
    cohesion: 60,
    readiness: 55,
    entrenchment: 38,
    momentum: 28
  },
  {
    id: "bef",
    side: "allied",
    name: "British Expeditionary Force",
    nodeId: "coulommiers",
    strength: 70,
    role: "reserve",
    stance: "hold",
    morale: 66,
    fatigue: 45,
    supply: 66,
    cohesion: 70,
    readiness: 58,
    entrenchment: 22,
    momentum: 25
  },
  {
    id: "rail_reserve",
    side: "allied",
    name: "Rail Reserve",
    nodeId: "paris_rail_hub",
    strength: 45,
    role: "rear",
    stance: "hold",
    morale: 60,
    fatigue: 25,
    supply: 75,
    cohesion: 68,
    readiness: 50,
    entrenchment: 15,
    momentum: 20
  },

  {
    id: "german_first_army",
    side: "german",
    name: "German First Army",
    nodeId: "senlis",
    strength: 260,
    role: "front",
    stance: "attack",
    morale: 76,
    fatigue: 42,
    supply: 68,
    cohesion: 72,
    readiness: 72,
    entrenchment: 12,
    momentum: 78
  },
  {
    id: "german_second_army",
    side: "german",
    name: "German Second Army",
    nodeId: "reims",
    strength: 230,
    role: "front",
    stance: "attack",
    morale: 74,
    fatigue: 40,
    supply: 70,
    cohesion: 72,
    readiness: 70,
    entrenchment: 12,
    momentum: 74
  },
  {
    id: "german_cavalry_screen",
    side: "german",
    name: "German Cavalry Screen",
    nodeId: "ourcq_line",
    strength: 35,
    role: "front",
    stance: "attack",
    morale: 70,
    fatigue: 35,
    supply: 62,
    cohesion: 58,
    readiness: 75,
    entrenchment: 5,
    momentum: 68
  },
  {
    id: "german_rear_supply",
    side: "german",
    name: "German Rear Supply",
    nodeId: "aisne_road",
    strength: 80,
    role: "rear",
    stance: "hold",
    morale: 68,
    fatigue: 25,
    supply: 78,
    cohesion: 66,
    readiness: 55,
    entrenchment: 15,
    momentum: 40
  }
];

export const initialGlobalState = {
  commandCohesion: 70,
  cityStability: 68,
  politicalPressure: 58,

  railwayCongestion: 72,
  railCapacity: 100,
  shortTermRedeployDelayMinutes: 0,

  intelligenceLevel: 35,
  flankGap: 20,
  observedFlankGap: 10,

  germanOperationalMomentum: 72,
  alliedOperationalMomentum: 35,

  germanSupplyPressure: 35,
  germanCommandCohesion: 65,

  cityVehiclesDiscovered: false,
  cityVehiclesAvailable: true,
  cityVehiclesUsed: false,
  cityVehicleBoostUntilMinutes: undefined,

  parisThreat: 0,
  threatAbove95Minutes: 0,
  parisContestedMinutes: 0,

  governmentCollapseRisk: 20,
  invalidCommandsInLast6Hours: 0,

  outcomeScores: {
    miracleMarne: 0,
    logisticsMaster: 0,
    tacticalGamble: 0,
    ahistoricalCollapse: 0
  }
};

function cloneUnits(): Unit[] {
  return INITIAL_UNITS.map((unit) => ({ ...unit }));
}

export function createInitialGameState(): GameState {
  return {
    currentTimeMinutes: 0,
    stateVersion: 1,
    gameEnded: false,

    commandCohesion: initialGlobalState.commandCohesion,
    cityStability: initialGlobalState.cityStability,
    politicalPressure: initialGlobalState.politicalPressure,

    railwayCongestion: initialGlobalState.railwayCongestion,
    railCapacity: initialGlobalState.railCapacity,
    shortTermRedeployDelayMinutes: initialGlobalState.shortTermRedeployDelayMinutes,

    intelligenceLevel: initialGlobalState.intelligenceLevel,
    flankGap: initialGlobalState.flankGap,
    observedFlankGap: initialGlobalState.observedFlankGap,

    germanOperationalMomentum: initialGlobalState.germanOperationalMomentum,
    alliedOperationalMomentum: initialGlobalState.alliedOperationalMomentum,

    germanSupplyPressure: initialGlobalState.germanSupplyPressure,
    germanCommandCohesion: initialGlobalState.germanCommandCohesion,

    cityVehiclesDiscovered: initialGlobalState.cityVehiclesDiscovered,
    cityVehiclesAvailable: initialGlobalState.cityVehiclesAvailable,
    cityVehiclesUsed: initialGlobalState.cityVehiclesUsed,
    cityVehicleBoostUntilMinutes: initialGlobalState.cityVehicleBoostUntilMinutes,

    parisThreat: initialGlobalState.parisThreat,
    threatAbove95Minutes: initialGlobalState.threatAbove95Minutes,
    parisContestedMinutes: initialGlobalState.parisContestedMinutes,

    governmentCollapseRisk: initialGlobalState.governmentCollapseRisk,
    invalidCommandsInLast6Hours: initialGlobalState.invalidCommandsInLast6Hours,

    units: cloneUnits(),
    nodes: MAP_NODE_LIST.map((node) => ({ ...node })),
    edges: MAP_EDGE_LIST.map((edge) => ({ ...edge, points: edge.points.map((point) => ({ ...point })) })),
    orderQueue: [],
    reports: [
      {
        id: "report-initial",
        createdAtMinutes: 0,
        headline: "Paris Emergency Window",
        reportText: "Operational countdown started. Paris and the Marne approach remain under pressure.",
        advisorLine: "You do not need perfect plans. You need coherent orders every 30 minutes.",
        eventType: "briefing"
      }
    ],
    knowledgeCards: [],

    outcomeScores: {
      miracleMarne: initialGlobalState.outcomeScores.miracleMarne,
      logisticsMaster: initialGlobalState.outcomeScores.logisticsMaster,
      tacticalGamble: initialGlobalState.outcomeScores.tacticalGamble,
      ahistoricalCollapse: initialGlobalState.outcomeScores.ahistoricalCollapse
    },

    pendingAgentState: {
      french: { status: "idle", lastRunMinutes: 0, pending: false },
      german: { status: "idle", lastRunMinutes: 0, pending: false },
      director: { status: "idle", lastRunMinutes: 0, pending: false },
      reporter: { status: "idle", lastRunMinutes: 0, pending: false }
    }
  };
}
