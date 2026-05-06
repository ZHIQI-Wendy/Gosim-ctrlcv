import { GameState, MapNodeId, Side, Unit } from "@/types";
import { clamp } from "@/lib/utils";

function adjacency(state: GameState): Map<MapNodeId, MapNodeId[]> {
  const graph = new Map<MapNodeId, MapNodeId[]>();
  state.nodes.forEach((node) => graph.set(node.id, []));
  state.edges.forEach((edge) => {
    graph.get(edge.from)?.push(edge.to);
    graph.get(edge.to)?.push(edge.from);
  });
  return graph;
}

function nodesWithinDistance(state: GameState, start: MapNodeId, maxDepth: number): Set<MapNodeId> {
  const graph = adjacency(state);
  const visited = new Set<MapNodeId>([start]);
  const queue: Array<{ node: MapNodeId; depth: number }> = [{ node: start, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (current.depth >= maxDepth) continue;

    for (const next of graph.get(current.node) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ node: next, depth: current.depth + 1 });
      }
    }
  }

  return visited;
}

function unitPressureScore(unit: Unit): number {
  return (
    unit.strength * 0.4 +
    unit.momentum * 0.25 +
    unit.readiness * 0.15 +
    unit.morale * 0.1 +
    unit.supply * 0.1
  );
}

function unitDefenseScore(unit: Unit): number {
  return (
    unit.strength * 0.32 +
    unit.entrenchment * 0.22 +
    unit.readiness * 0.16 +
    unit.morale * 0.15 +
    unit.cohesion * 0.15
  );
}

export function getGermanPressureNearParis(state: GameState): number {
  const nearParis = nodesWithinDistance(state, "paris", 2);
  const units = state.units.filter(
    (unit) => unit.side === "german" && unit.role === "front" && nearParis.has(unit.nodeId)
  );

  if (!units.length) return 0;

  const total = units.reduce((sum, unit) => sum + unitPressureScore(unit), 0);
  return clamp(total / 25, 0, 100);
}

export function getAlliedDefenseNearParis(state: GameState): number {
  const nearParis = nodesWithinDistance(state, "paris", 1);
  const units = state.units.filter(
    (unit) =>
      unit.side === "allied" &&
      (unit.role === "front" || unit.role === "reserve") &&
      nearParis.has(unit.nodeId)
  );

  if (!units.length) return 0;

  const total = units.reduce((sum, unit) => sum + unitDefenseScore(unit), 0);
  return clamp(total / 32, 0, 100);
}

function routeNodePressure(state: GameState, nodeId: MapNodeId): number {
  const node = state.nodes.find((item) => item.id === nodeId);
  if (!node) return 0;

  let pressure = 0;
  if (node.control === "german") pressure += 20;
  if (node.control === "contested") pressure += 12;
  if (node.control === "allied") pressure += 5;

  const alliedDefense = state.units
    .filter(
      (unit) =>
        unit.side === "allied" &&
        (unit.role === "front" || unit.role === "reserve") &&
        unit.nodeId === nodeId
    )
    .reduce((sum, unit) => sum + unitDefenseScore(unit), 0);

  const germanOffense = state.units
    .filter((unit) => unit.side === "german" && unit.role === "front" && unit.nodeId === nodeId)
    .reduce((sum, unit) => sum + unitPressureScore(unit), 0);

  pressure += clamp((germanOffense - alliedDefense) / 12, -10, 25);
  return pressure;
}

export function getRoutePressureToParis(state: GameState): number {
  const keyNodes: MapNodeId[] = [
    "meaux",
    "ourcq_line",
    "marne_crossings",
    "paris_rail_hub",
    "aisne_road"
  ];

  const value = keyNodes.reduce((sum, nodeId) => sum + routeNodePressure(state, nodeId), 0);
  return clamp(value / keyNodes.length, 0, 100);
}

export function calculateParisThreat(state: GameState): number {
  const germanNearParis = getGermanPressureNearParis(state);
  const parisDefense = getAlliedDefenseNearParis(state);
  const routePressure = getRoutePressureToParis(state);

  const politicalRisk = state.politicalPressure;
  const cityRisk = 100 - state.cityStability;
  const commandRisk = 100 - state.commandCohesion;

  const threat =
    20 +
    germanNearParis * 0.3 +
    routePressure * 0.25 +
    politicalRisk * 0.15 +
    cityRisk * 0.15 +
    commandRisk * 0.1 -
    parisDefense * 0.25;

  return clamp(threat, 0, 100);
}

export function isParisHeld(state: GameState): boolean {
  const parisNode = state.nodes.find((node) => node.id === "paris");
  return parisNode?.control === "allied";
}

export function localGermanPowerRatio(state: GameState, nodeId: MapNodeId): number {
  const localAllied = state.units
    .filter((unit) => unit.side === "allied" && unit.role === "front" && unit.nodeId === nodeId)
    .reduce((sum, unit) => sum + unitPressureScore(unit), 0);

  const localGerman = state.units
    .filter((unit) => unit.side === "german" && unit.role === "front" && unit.nodeId === nodeId)
    .reduce((sum, unit) => sum + unitPressureScore(unit), 0);

  const total = localAllied + localGerman;
  if (total <= 0) return 0;
  return localGerman / total;
}

export function averageMorale(state: GameState, side: Side): number {
  const units = state.units.filter((unit) => unit.side === side);
  if (!units.length) return 0;
  return units.reduce((sum, unit) => sum + unit.morale, 0) / units.length;
}
