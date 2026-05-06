import { MOVEMENT_RULES, PX_TO_KM } from "@/data/movementRules";
import { canUseCityVehicle, clampState, isParisLocalEdge } from "@/lib/validators";
import { clamp } from "@/lib/utils";
import { GameState, MapEdge, MapNodeId, MovementOption, Point, TransportMode, Unit } from "@/types";

const RIVERS: Point[][] = [
  [
    { x: 470, y: 175 },
    { x: 560, y: 160 },
    { x: 640, y: 170 },
    { x: 720, y: 188 },
    { x: 805, y: 206 },
    { x: 900, y: 180 },
    { x: 985, y: 190 }
  ],
  [
    { x: 225, y: 330 },
    { x: 310, y: 312 },
    { x: 395, y: 318 },
    { x: 485, y: 330 },
    { x: 575, y: 343 },
    { x: 665, y: 345 },
    { x: 760, y: 325 },
    { x: 835, y: 310 },
    { x: 925, y: 310 }
  ],
  [
    { x: 245, y: 396 },
    { x: 320, y: 408 },
    { x: 392, y: 414 },
    { x: 455, y: 410 },
    { x: 555, y: 404 },
    { x: 635, y: 434 },
    { x: 710, y: 441 },
    { x: 792, y: 449 },
    { x: 872, y: 463 },
    { x: 948, y: 482 },
    { x: 1012, y: 498 },
    { x: 1076, y: 514 },
    { x: 1140, y: 536 }
  ],
  [
    { x: 445, y: 552 },
    { x: 535, y: 545 },
    { x: 615, y: 544 },
    { x: 695, y: 551 },
    { x: 775, y: 559 },
    { x: 845, y: 571 },
    { x: 905, y: 590 }
  ],
  [
    { x: 360, y: 615 },
    { x: 455, y: 620 },
    { x: 540, y: 624 },
    { x: 635, y: 633 },
    { x: 735, y: 643 },
    { x: 820, y: 654 },
    { x: 905, y: 676 }
  ],
  [
    { x: 145, y: 430 },
    { x: 122, y: 500 },
    { x: 120, y: 575 },
    { x: 160, y: 640 },
    { x: 182, y: 690 },
    { x: 172, y: 760 },
    { x: 132, y: 842 }
  ]
];

function distPx(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceKmFromPolyline(points: Point[]): number {
  if (points.length < 2) return 0;
  let totalPx = 0;
  for (let i = 1; i < points.length; i += 1) {
    totalPx += distPx(points[i - 1], points[i]);
  }
  return totalPx * PX_TO_KM;
}

function orientation(a: Point, b: Point, c: Point): number {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(value) < 1e-9) return 0;
  return value > 0 ? 1 : 2;
}

function onSegment(a: Point, b: Point, c: Point): boolean {
  return (
    b.x <= Math.max(a.x, c.x) &&
    b.x >= Math.min(a.x, c.x) &&
    b.y <= Math.max(a.y, c.y) &&
    b.y >= Math.min(a.y, c.y)
  );
}

function segmentsIntersect(p1: Point, q1: Point, p2: Point, q2: Point): boolean {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;
  return false;
}

function countRiverCrossings(line: Point[]): number {
  if (line.length < 2) return 0;
  const touched = new Set<number>();
  for (let segmentIndex = 1; segmentIndex < line.length; segmentIndex += 1) {
    const p1 = line[segmentIndex - 1];
    const q1 = line[segmentIndex];
    RIVERS.forEach((river, riverIndex) => {
      for (let i = 1; i < river.length; i += 1) {
        const p2 = river[i - 1];
        const q2 = river[i];
        if (segmentsIntersect(p1, q1, p2, q2)) {
          touched.add(riverIndex);
          break;
        }
      }
    });
  }
  return touched.size;
}

function getNodePoint(state: GameState, nodeId: MapNodeId): Point {
  const node = state.nodes.find((item) => item.id === nodeId);
  if (!node) {
    throw new Error(`Missing node: ${nodeId}`);
  }
  return node.point;
}

export function getEffectiveSpeed(
  unit: Unit | undefined,
  mode: TransportMode,
  state: GameState
): number {
  let speed = MOVEMENT_RULES[mode].speedKmh;

  if (mode === "rail") {
    const congestionFactor = clamp((120 - state.railwayCongestion) / 100, 0.4, 1.1);
    const capacityFactor = clamp(state.railCapacity / 100, 0.7, 1.3);
    speed *= congestionFactor * capacityFactor;
  }

  if (unit) {
    if (unit.fatigue > 75) speed *= 0.75;
    if (unit.supply < 40) speed *= 0.85;
  }

  return Math.max(0.4, speed);
}

function edgeAllowedForMode(
  edge: MapEdge,
  mode: TransportMode,
  state: GameState,
  unit: Unit | undefined
): boolean {
  if (!edge.modes.includes(mode)) return false;

  if (mode === "city_vehicle") {
    if (!unit || !canUseCityVehicle(state, unit)) return false;
    if (!isParisLocalEdge(edge.id, state)) return false;
  }

  return true;
}

function computeEdgeHours(edge: MapEdge, mode: TransportMode, state: GameState, unit?: Unit): number {
  const speed = getEffectiveSpeed(unit, mode, state);
  const distanceKm = distanceKmFromPolyline(edge.points);
  const crossingDelay = edge.riverCrossings * MOVEMENT_RULES[mode].riverCrossingDelayHours;
  return distanceKm / speed + crossingDelay;
}

export function dijkstraByMode(
  start: MapNodeId,
  end: MapNodeId,
  mode: TransportMode,
  state: GameState,
  unit?: Unit
): MovementOption | null {
  if (start === end) {
    return {
      mode,
      distanceKm: 0,
      riverCrossings: 0,
      hours: 0,
      path: [getNodePoint(state, start), getNodePoint(state, end)],
      nodePath: [start, end]
    };
  }

  const distances = new Map<MapNodeId, number>();
  const previous = new Map<MapNodeId, { node: MapNodeId; edge: MapEdge }>();
  const visited = new Set<MapNodeId>();

  state.nodes.forEach((node) => distances.set(node.id, Number.POSITIVE_INFINITY));
  distances.set(start, 0);

  while (visited.size < state.nodes.length) {
    let current: MapNodeId | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const [nodeId, distance] of distances.entries()) {
      if (!visited.has(nodeId) && distance < bestDistance) {
        current = nodeId;
        bestDistance = distance;
      }
    }

    if (!current || bestDistance === Number.POSITIVE_INFINITY) break;
    if (current === end) break;

    visited.add(current);

    for (const edge of state.edges) {
      const neighbor =
        edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (!neighbor) continue;
      if (!edgeAllowedForMode(edge, mode, state, unit)) continue;

      const travelHours = computeEdgeHours(edge, mode, state, unit);
      const candidate = bestDistance + travelHours;

      if (candidate < (distances.get(neighbor) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighbor, candidate);
        previous.set(neighbor, { node: current, edge });
      }
    }
  }

  const totalHours = distances.get(end);
  if (totalHours === undefined || !Number.isFinite(totalHours)) return null;

  const nodePath: MapNodeId[] = [end];
  const edgesPath: MapEdge[] = [];
  let cursor: MapNodeId = end;

  while (cursor !== start) {
    const step = previous.get(cursor);
    if (!step) return null;
    edgesPath.push(step.edge);
    nodePath.push(step.node);
    cursor = step.node;
  }

  nodePath.reverse();
  edgesPath.reverse();

  const points: Point[] = [];
  edgesPath.forEach((edge, index) => {
    if (index === 0) {
      points.push(...edge.points.map((point) => ({ ...point })));
    } else {
      points.push(...edge.points.slice(1).map((point) => ({ ...point })));
    }
  });

  const distanceKm = edgesPath.reduce((sum, edge) => sum + distanceKmFromPolyline(edge.points), 0);
  const riverCrossings = edgesPath.reduce((sum, edge) => sum + edge.riverCrossings, 0);

  return {
    mode,
    distanceKm,
    riverCrossings,
    hours: totalHours,
    path: points,
    nodePath
  };
}

export function getFieldOption(
  start: MapNodeId,
  end: MapNodeId,
  state: GameState,
  unit?: Unit
): MovementOption {
  const startPoint = getNodePoint(state, start);
  const endPoint = getNodePoint(state, end);
  const path = [startPoint, endPoint];
  const distanceKm = distanceKmFromPolyline(path);
  const riverCrossings = countRiverCrossings(path);
  const speed = getEffectiveSpeed(unit, "field", state);
  const hours = distanceKm / speed + riverCrossings * MOVEMENT_RULES.field.riverCrossingDelayHours;

  return {
    mode: "field",
    distanceKm,
    riverCrossings,
    hours,
    path,
    nodePath: [start, end]
  };
}

export function getMovementOptions(
  start: MapNodeId,
  end: MapNodeId,
  state: GameState,
  unit?: Unit
): MovementOption[] {
  const options: MovementOption[] = [];
  for (const mode of ["rail", "road", "city_vehicle"] as TransportMode[]) {
    const option = dijkstraByMode(start, end, mode, state, unit);
    if (option) options.push(option);
  }

  options.push(getFieldOption(start, end, state, unit));
  return options.sort((a, b) => a.hours - b.hours);
}

export function pointListToPathD(points: Point[]): string {
  if (!points.length) return "";
  const [first, ...rest] = points;
  return `M${first.x},${first.y} ${rest.map((point) => `L${point.x},${point.y}`).join(" ")}`;
}

export function renderMovementLine(svg: SVGSVGElement, option: MovementOption, id: string): SVGPathElement {
  const existing = svg.querySelector(`#${id}`);
  if (existing) existing.remove();

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("id", id);
  path.setAttribute("d", pointListToPathD(option.path));
  path.setAttribute("class", MOVEMENT_RULES[option.mode].lineClass);

  const layer = svg.querySelector("#dynamic-route-layer");
  if (layer) {
    layer.appendChild(path);
  } else {
    svg.appendChild(path);
  }

  return path;
}

export function cloneAndClampState(state: GameState): GameState {
  return clampState({
    ...state,
    units: state.units.map((unit) => ({ ...unit })),
    nodes: state.nodes.map((node) => ({ ...node })),
    edges: state.edges.map((edge) => ({ ...edge, points: edge.points.map((point) => ({ ...point })) })),
    orderQueue: state.orderQueue.map((order) => ({ ...order })),
    reports: state.reports.map((report) => ({ ...report })),
    knowledgeCards: state.knowledgeCards.map((card) => ({ ...card }))
  });
}
