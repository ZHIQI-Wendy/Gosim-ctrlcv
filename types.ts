export type Side = "allied" | "german";
export type NodeControl = "allied" | "german" | "contested" | "neutral";

export type UnitRole = "front" | "reserve" | "rear" | "moving";
export type Stance = "defend" | "delay" | "attack" | "hold" | "retreat";

export type TransportMode =
  | "rail"
  | "road"
  | "field"
  | "river_crossing"
  | "city_vehicle";

export type MapNodeId =
  | "paris"
  | "paris_rail_hub"
  | "ourcq_line"
  | "meaux"
  | "marne_crossings"
  | "coulommiers"
  | "montmirail"
  | "senlis"
  | "aisne_road"
  | "soissons"
  | "chateau_thierry"
  | "reims"
  | "epernay"
  | "chalons"
  | "verdun"
  | "bar_le_duc"
  | "sezanne"
  | "fere_champenoise";

export type Point = {
  x: number;
  y: number;
};

export type MapNode = {
  id: MapNodeId;
  name: string;
  point: Point;
  type: "city" | "river" | "rail" | "road" | "field" | "crossing";
  control: NodeControl;
  defenseValue: number;
  politicalValue: number;
  supplyValue: number;
  transportValue: number;
  isRailHub?: boolean;
  isParisArea?: boolean;
  commonInfo?: string;
  specialInfo?: string;
  controlPressure?: number;
};

export type MapEdge = {
  id: string;
  from: MapNodeId;
  to: MapNodeId;
  modes: TransportMode[];
  points: Point[];
  riverCrossings: number;
  capacity?: number;
  notes?: string;
};

export type Unit = {
  id: string;
  side: Side;
  name: string;
  nodeId: MapNodeId;
  role: UnitRole;
  stance: Stance;
  strength: number;
  morale: number;
  fatigue: number;
  supply: number;
  cohesion: number;
  readiness: number;
  entrenchment: number;
  momentum: number;
  movingTo?: MapNodeId;
  movementMode?: TransportMode;
  travelProgress?: number;
};

export type OutcomeScores = {
  miracleMarne: number;
  logisticsMaster: number;
  tacticalGamble: number;
  ahistoricalCollapse: number;
};

export type Report = {
  id: string;
  createdAtMinutes: number;
  headline: string;
  reportText: string;
  advisorLine?: string;
  knowledgeHint?: string;
  eventType?: string;
};

export type KnowledgeCard = {
  id: string;
  title: string;
  content: string;
  discoveredAtMinutes: number;
};

export type AllowedAction =
  | "DEFEND"
  | "DELAY"
  | "COUNTERATTACK"
  | "REDEPLOY"
  | "RECON"
  | "OPTIMIZE_RAIL"
  | "PROPAGANDA"
  | "MOBILIZE_CITY"
  | "INVALID_TO_CHAOS";

export type Order = {
  id: string;
  action: AllowedAction;
  targetNodeId?: MapNodeId;
  unitId?: string;
  createdAtMinutes: number;
  delayMinutes: number;
  durationMinutes: number;
  status: "queued" | "active" | "completed" | "failed";
  payload?: Record<string, unknown>;
};

export type AIOrderContext = {
  action: AllowedAction;
  targetNodeId?: MapNodeId;
  unitId?: string;
  status: "queued" | "active" | "completed" | "failed";
  createdAtMinutes: number;
  delayMinutes: number;
  durationMinutes: number;
};

export type GameState = {
  currentTimeMinutes: number;
  gameEnded: boolean;

  commandCohesion: number;
  cityStability: number;
  politicalPressure: number;

  railwayCongestion: number;
  railCapacity: number;
  shortTermRedeployDelayMinutes: number;

  intelligenceLevel: number;
  flankGap: number;
  observedFlankGap: number;

  germanOperationalMomentum: number;
  alliedOperationalMomentum: number;

  germanSupplyPressure: number;
  germanCommandCohesion: number;

  cityVehiclesDiscovered: boolean;
  cityVehiclesAvailable: boolean;
  cityVehiclesUsed: boolean;
  cityVehicleBoostUntilMinutes?: number;

  parisThreat: number;
  threatAbove95Minutes: number;
  parisContestedMinutes: number;

  governmentCollapseRisk: number;
  invalidCommandsInLast6Hours: number;

  units: Unit[];
  nodes: MapNode[];
  edges: MapEdge[];
  orderQueue: Order[];
  reports: Report[];
  knowledgeCards: KnowledgeCard[];

  outcomeScores: OutcomeScores;
};

export type MovementOption = {
  mode: TransportMode;
  distanceKm: number;
  riverCrossings: number;
  hours: number;
  path: Point[];
  nodePath?: MapNodeId[];
};

export type GovernmentDecisionInput = {
  currentTimeMinutes: number;
  publicState: {
    parisThreat: number;
    cityStability: number;
    politicalPressure: number;
    commandCohesion: number;
    railwayCongestion: number;
    alliedOperationalMomentum: number;
    germanOperationalMomentum: number;
  };
  hiddenState: {
    governmentCollapseRisk: number;
    invalidCommandsInLast6Hours: number;
    threatAbove95Minutes: number;
    parisContestedMinutes: number;
  };
  activeOrders: AIOrderContext[];
  recentOrders: AIOrderContext[];
  recentEvents: string[];
};

export type GovernmentDecisionOutput = {
  trigger: boolean;
  action: "NO_ACTION" | "EMERGENCY_DIRECTIVE";
  publicMessage: string;
  stateDelta: {
    cityStability: number;
    politicalPressure: number;
    commandCohesion: number;
    governmentCollapseRisk: number;
    alliedOperationalMomentum: number;
  };
  durationMinutes: number;
  severity: "minor" | "medium" | "major";
  confidence: number;
  privateRationale: string;
};

export type FrenchCommandParserInput = {
  rawText: string;
  selectedNodeId?: MapNodeId;
  selectedUnitId?: string;
  visibleState: {
    currentTimeMinutes: number;
    parisThreat: number;
    observedFlankGap: number;
    railwayCongestion: number;
    cityVehiclesDiscovered: boolean;
    knownNodes: MapNodeId[];
    knownUnits: string[];
  };
  activeOrders: AIOrderContext[];
  recentOrders: AIOrderContext[];
  recentEvents: string[];
};

export type FrenchCommandParserOutput = {
  action: AllowedAction;
  targetNodeId: MapNodeId | null;
  unitId: string | null;
  urgency: "low" | "medium" | "high";
  riskTolerance: "low" | "medium" | "high";
  constraints: {
    avoidHeavyLosses: boolean;
    preserveParis: boolean;
    preserveReserves: boolean;
    prioritizeSpeed: boolean;
  };
  historicalValidity: "high" | "medium" | "low" | "impossible";
  ambiguity: "none" | "low" | "medium" | "high";
  mappedOrderText: string;
  explanation: string;
};

export type GermanAgentAction =
  | "ADVANCE"
  | "ATTACK"
  | "PROBE"
  | "HOLD"
  | "REDEPLOY"
  | "CONSOLIDATE";

export type GermanAgentInput = {
  currentTimeMinutes: number;
  strategicState: {
    parisThreat: number;
    flankGap: number;
    germanOperationalMomentum: number;
    alliedOperationalMomentum: number;
    railwayCongestion: number;
    intelligenceLevel: number;
  };
  germanState: {
    supplyPressure: number;
    commandCohesion: number;
    fatigueAverage: number;
    frontStrength: number;
    rearStability: number;
  };
  visibleNodes: Array<{
    nodeId: MapNodeId;
    control: NodeControl;
    localAlliedPowerEstimate: number;
    localGermanPower: number;
    routeValueToParis: number;
  }>;
  availableUnitIds: string[];
  activeOrders: AIOrderContext[];
  recentOrders: AIOrderContext[];
  recentEvents: string[];
};

export type GermanAgentOutput = {
  action: GermanAgentAction;
  targetNodeId: MapNodeId | null;
  unitIds: string[];
  stance: "aggressive" | "balanced" | "cautious";
  intensity: "low" | "medium" | "high";
  expectedEffect: {
    targetPressure: number;
    supplyRisk: number;
    flankRisk: number;
  };
  confidence: number;
  rationale: string;
};

export type EnvironmentalAdjudicatorInput = {
  eventType: "combat" | "movement" | "logistics" | "political" | "morale" | "urban_mobilization";
  currentTimeMinutes: number;
  nodeContext?: {
    nodeId: MapNodeId;
    terrain: "city" | "river" | "rail" | "road" | "field" | "crossing";
    control: NodeControl;
    defenseValue: number;
    transportValue: number;
  };
  involvedUnits: Array<{
    unitId: string;
    side: Side;
    stance: string;
    strength: number;
    morale: number;
    fatigue: number;
    supply: number;
    cohesion: number;
  }>;
  baseResult: {
    alliedLoss: number;
    germanLoss: number;
    nodeControlDelta: number;
    moraleDelta: number;
    fatigueDelta: number;
  };
  globalState: {
    parisThreat: number;
    railwayCongestion: number;
    cityStability: number;
    politicalPressure: number;
    flankGap: number;
  };
};

export type EnvironmentalAdjudicatorOutput = {
  modifierType: "extra_loss" | "reduced_loss" | "morale_shift" | "movement_delay" | "control_bonus" | "no_modifier";
  affectedSide: "allied" | "german" | "both" | "none";
  affectedUnitIds: string[];
  numericModifiers: {
    extraStrengthLossPct: number;
    moraleDelta: number;
    fatigueDelta: number;
    movementDelayMinutes: number;
    nodeControlDelta: number;
  };
  severity: "minor" | "medium" | "major";
  durationMinutes: number;
  rationale: string;
};

export type ReportGeneratorInput = {
  currentTimeMinutes: number;
  publicState: {
    parisThreat: number;
    observedFlankGap: number;
    cityStability: number;
    politicalPressure: number;
    railwayCongestion: number;
  };
  latestEvents: Array<{
    type: string;
    nodeId?: MapNodeId;
    unitIds?: string[];
    resultSummary: string;
  }>;
  activeOrders: AIOrderContext[];
  recentOrders: AIOrderContext[];
  tone: "staff_report" | "advisor" | "historian" | "newspaper";
};

export type ReportGeneratorOutput = {
  headline: string;
  reportText: string;
  advisorLine: string;
  knowledgeHint?: string;
  privateRationale: string;
};

export type EndingType =
  | "miracleMarne"
  | "logisticsMaster"
  | "tacticalGamble"
  | "costlyStalemate"
  | "parisPoliticalCrisis"
  | "germanBreakthrough"
  | "ahistoricalCollapse"
  | "collapse";

export type ReportTone = ReportGeneratorInput["tone"];

export type GameStateData = GameState;
export type BattleReport = Report;
export type OutcomeKey = EndingType;
export type CityId = MapNodeId;

export type AgentLine = {
  id: string;
  speaker: "Adviser" | "Friendly HQ" | "German HQ";
  text: string;
};
