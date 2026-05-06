import { GameState, MapNode, MapNodeId, Side, Unit } from "@/types";
import { clamp, rand } from "@/lib/utils";

export type CombatEvent = {
  nodeId: MapNodeId;
  alliedLoss: number;
  germanLoss: number;
  intensity: number;
  alliedPower: number;
  germanPower: number;
  major: boolean;
  involvedUnitIds: string[];
};

function getTerrainDefenseFactor(unit: Unit, node: MapNode): number {
  if (node.type === "city") return unit.side === "allied" ? 1.15 : 1.08;
  if (node.type === "crossing") return 0.92;
  if (node.type === "river") return 0.95;
  if (node.type === "field") return 0.98;
  return 1;
}

function getStanceFactor(stance: Unit["stance"]): number {
  if (stance === "attack") return 1.1;
  if (stance === "defend") return 1.04;
  if (stance === "delay") return 0.95;
  if (stance === "retreat") return 0.82;
  return 1;
}

function getRearStabilityFactor(side: Side, state: GameState): number {
  if (side === "allied") {
    const value =
      state.commandCohesion * 0.35 +
      state.cityStability * 0.25 +
      (100 - state.railwayCongestion) * 0.25 -
      state.politicalPressure * 0.15 +
      70;

    return clamp(value / 100, 0.65, 1.15);
  }

  const value =
    state.germanOperationalMomentum * 0.35 +
    (100 - state.flankGap) * 0.3 +
    (100 - state.germanSupplyPressure) * 0.2 +
    state.germanCommandCohesion * 0.15;

  return clamp(value / 100, 0.65, 1.15);
}

export function unitCombatPower(unit: Unit, state: GameState, node: MapNode): number {
  const moraleFactor = 0.5 + unit.morale / 100;
  const fatigueFactor = 1.2 - unit.fatigue / 120;
  const supplyFactor = 0.5 + unit.supply / 100;
  const cohesionFactor = 0.5 + unit.cohesion / 100;
  const readinessFactor = 0.5 + unit.readiness / 100;

  const entrenchmentFactor = unit.stance === "defend" ? 1 + unit.entrenchment / 150 : 1;
  const terrainFactor = getTerrainDefenseFactor(unit, node);
  const stanceFactor = getStanceFactor(unit.stance);
  const rearFactor = getRearStabilityFactor(unit.side, state);
  const randomFactor = rand(0.9, 1.1);

  return (
    unit.strength *
    moraleFactor *
    fatigueFactor *
    supplyFactor *
    cohesionFactor *
    readinessFactor *
    entrenchmentFactor *
    terrainFactor *
    stanceFactor *
    rearFactor *
    randomFactor
  );
}

function combatIntensity(node: MapNode, allied: Unit[], german: Unit[], state: GameState): number {
  if (node.type === "crossing") return 0.022;
  if (node.id === "paris" && state.parisThreat >= 90) return 0.025;

  const alliedAttack = allied.some((unit) => unit.stance === "attack");
  const germanAttack = german.some((unit) => unit.stance === "attack");
  const alliedDelay = allied.some((unit) => unit.stance === "delay");
  const germanDelay = german.some((unit) => unit.stance === "delay");

  if (!alliedAttack && !germanAttack && !alliedDelay && !germanDelay) return 0.006;
  if (alliedAttack && germanAttack) return 0.026;
  if (alliedDelay || germanDelay) return 0.01;
  if (alliedAttack || germanAttack) return 0.018;
  return 0.01;
}

function frontUnitsAtNode(state: GameState, side: Side, nodeId: MapNodeId): Unit[] {
  return state.units.filter(
    (unit) =>
      unit.side === side &&
      unit.role === "front" &&
      unit.strength > 0 &&
      unit.readiness > 20 &&
      unit.nodeId === nodeId
  );
}

function updateNodeControl(node: MapNode, alliedPower: number, germanPower: number): void {
  const delta = (alliedPower - germanPower) / 60;
  node.controlPressure = clamp((node.controlPressure ?? 0) + delta, -100, 100);

  if ((node.controlPressure ?? 0) > 55) {
    node.control = "allied";
  } else if ((node.controlPressure ?? 0) < -55) {
    node.control = "german";
  } else {
    node.control = "contested";
  }
}

function applyUnitLoss(unit: Unit, rate: number): number {
  const original = unit.strength;
  const next = Math.max(0, original * (1 - rate));
  unit.strength = next;

  const loss = original - next;
  unit.morale = clamp(unit.morale - rate * 55);
  unit.fatigue = clamp(unit.fatigue + 3 + rate * 30);
  unit.cohesion = clamp(unit.cohesion - rate * 28);
  return loss;
}

export function resolveCombatStep(state: GameState): CombatEvent[] {
  const events: CombatEvent[] = [];

  const contestedNodes = state.nodes.filter((node) => node.control === "contested");
  for (const node of contestedNodes) {
    const allied = frontUnitsAtNode(state, "allied", node.id);
    const german = frontUnitsAtNode(state, "german", node.id);
    if (!allied.length || !german.length) continue;

    const alliedPower = allied.reduce((sum, unit) => sum + unitCombatPower(unit, state, node), 0);
    const germanPower = german.reduce((sum, unit) => sum + unitCombatPower(unit, state, node), 0);

    const totalPower = alliedPower + germanPower;
    if (totalPower <= 0) continue;

    const alliedRatio = alliedPower / totalPower;
    const germanRatio = germanPower / totalPower;

    const intensity = combatIntensity(node, allied, german, state);
    const alliedLossRate = intensity * germanRatio * rand(0.6, 1.25);
    const germanLossRate = intensity * alliedRatio * rand(0.6, 1.25);

    let alliedLoss = 0;
    let germanLoss = 0;
    allied.forEach((unit) => {
      alliedLoss += applyUnitLoss(unit, alliedLossRate);
    });
    german.forEach((unit) => {
      germanLoss += applyUnitLoss(unit, germanLossRate);
    });

    updateNodeControl(node, alliedPower, germanPower);

    const major = intensity >= 0.018 || alliedLoss + germanLoss > 20;
    events.push({
      nodeId: node.id,
      alliedLoss,
      germanLoss,
      intensity,
      alliedPower,
      germanPower,
      major,
      involvedUnitIds: [...allied.map((unit) => unit.id), ...german.map((unit) => unit.id)]
    });
  }

  return events;
}
