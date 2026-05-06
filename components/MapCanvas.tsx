// components/MapCanvas.tsx
"use client";

import { useMemo } from "react";
import { GameStateData, MapNodeId, Point, Side, Unit } from "@/types";
import { pointListToPathD } from "@/lib/movement";

function lineClass(mode?: Unit["movementMode"]): string {
  if (mode === "rail") return "move-line-rail";
  if (mode === "road") return "move-line-road";
  if (mode === "field") return "move-line-field";
  if (mode === "river_crossing") return "move-line-river-crossing";
  if (mode === "city_vehicle") return "move-line-city-vehicle";
  return "move-line-road";
}

function nodePoint(state: GameStateData, nodeId: MapNodeId): Point {
  const node = state.nodes.find((item) => item.id === nodeId);
  if (!node) return { x: 0, y: 0 };
  return node.point;
}

function unitRenderPoint(state: GameStateData, unit: Unit): Point {
  const at = nodePoint(state, unit.nodeId);
  if (unit.role !== "moving" || !unit.movingTo || unit.travelProgress === undefined) {
    return at;
  }

  const dest = nodePoint(state, unit.movingTo);
  const t = Math.max(0, Math.min(1, unit.travelProgress));
  return {
    x: at.x + (dest.x - at.x) * t,
    y: at.y + (dest.y - at.y) * t
  };
}

function groupedUnits(state: GameStateData): Record<MapNodeId, Unit[]> {
  const grouped = {} as Record<MapNodeId, Unit[]>;
  state.nodes.forEach((node) => {
    grouped[node.id] = [];
  });
  state.units.forEach((unit) => {
    if (!grouped[unit.nodeId]) grouped[unit.nodeId] = [];
    grouped[unit.nodeId].push(unit);
  });
  return grouped;
}

function unitColorClass(side: Side): string {
  return side === "allied" ? "unit-square-allied" : "unit-square-german";
}

export function MapCanvas({
  game,
  selectedNode,
  onNodeSelect
}: {
  game: GameStateData;
  selectedNode: MapNodeId | null;
  onNodeSelect: (city: MapNodeId, point: Point) => void;
}) {
  const grouped = useMemo(() => groupedUnits(game), [game]);

  return (
    <section className="map-canvas" aria-label="Battlefield map">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1400"
        height="900"
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <style>{`
            .river { fill: none; stroke: #4f8fd7; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
            .river.minor { stroke-width: 3.2; }
            .road { fill: none; stroke: #91897c; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
            .road.major { stroke-width: 3; }
            .rail { fill: none; stroke: #1f1f1f; stroke-width: 2.2; stroke-dasharray: 11 5 2 5; stroke-linecap: round; stroke-linejoin: round; }
            .map-city-hitbox { fill: transparent; pointer-events: all; }
            .map-city-dot { fill: #fffdf8; stroke: #111; stroke-width: 2.2; transition: stroke-width 0.12s ease; }
            .map-city-major { r: 8; }
            .map-city-minor { r: 6; }
            .map-city-label {
              font: 16px Georgia, serif;
              font-weight: 700;
              fill: #1b140b;
              stroke: rgba(247, 234, 206, 0.88);
              stroke-width: 2.2;
              paint-order: stroke fill;
              stroke-linejoin: round;
              pointer-events: none;
            }
            .frontline { fill: none; stroke: #786757; stroke-width: 5; stroke-dasharray: 14 10; stroke-linecap: round; stroke-linejoin: round; }
            .map-city-node { cursor: pointer; }
            .map-city-node:hover .map-city-dot { stroke-width: 3.2; }
            .map-city-node.map-city-selected .map-city-dot { stroke: #3b78c8; stroke-width: 3.5; }
            .map-sector-label {
              font: 16px Georgia, serif;
              font-weight: 700;
              fill: #243f6a;
              stroke: rgba(247, 236, 213, 0.85);
              stroke-width: 1.4;
              paint-order: stroke fill;
            }
            .map-sector-label.enemy {
              fill: #9b392f;
            }

            .move-line-rail { fill: none; stroke: #111; stroke-width: 3; stroke-dasharray: 10 5 2 5; opacity: 0.75; }
            .move-line-road { fill: none; stroke: #8a6a3f; stroke-width: 3; stroke-dasharray: 8 5; opacity: 0.75; }
            .move-line-field { fill: none; stroke: #7a8f4a; stroke-width: 2.5; stroke-dasharray: 3 6; opacity: 0.75; }
            .move-line-river-crossing { fill: none; stroke: #2b69ad; stroke-width: 4; stroke-dasharray: 2 4; opacity: 0.85; }
            .move-line-city-vehicle { fill: none; stroke: #6f4aa8; stroke-width: 3.5; stroke-dasharray: 12 4; opacity: 0.85; }

            .unit-square-allied { fill: #3b78c8; stroke: #214d88; stroke-width: 1; }
            .unit-square-german { fill: #c94a40; stroke: #862f29; stroke-width: 1; }
            .unit-group-label {
              font: 12px Georgia, serif;
              font-weight: 700;
              fill: #1a1309;
              stroke: rgba(247, 236, 213, 0.85);
              stroke-width: 1.7;
              paint-order: stroke fill;
              pointer-events: none;
            }
          `}</style>
        </defs>

        <g id="hydrology-layer">
          <path className="river minor" d="M470,175 C560,160 640,170 720,188 C805,206 900,180 985,190" />
          <path className="river minor" d="M225,330 C310,312 395,318 485,330 C575,343 665,345 760,325 C835,310 880,303 925,310" />
          <path className="river" d="M245,396 C320,408 392,414 455,410 C555,404 635,434 710,441 C792,449 872,463 948,482 C1012,498 1076,514 1140,536" />
          <path className="river minor" d="M445,552 C535,545 615,544 695,551 C775,559 845,571 905,590" />
          <path className="river minor" d="M360,615 C455,620 540,624 635,633 C735,643 820,654 905,676" />
          <path className="river" d="M145,430 C122,500 120,575 160,640 C182,690 172,760 132,842" />
        </g>

        <g id="roads-layer">
          <path className="road major" d="M160,470 L255,437 L350,400 L490,360 L600,330 L730,305 L860,280" />
          <path className="road major" d="M860,280 L940,410 L850,460" />
          <path className="road major" d="M850,460 L955,486 L1060,510" />
          <path className="road major" d="M1060,510 L1170,590 L1230,720" />
          <path className="road major" d="M1230,720 L1260,580 L1280,430" />
          <path className="road" d="M160,470 L220,320 L160,170" />
          <path className="road" d="M160,170 L330,160 L500,150" />
          <path className="road" d="M500,150 L660,195 L860,280" />
          <path className="road major" d="M350,400 L420,480 L480,570" />
          <path className="road major" d="M480,570 L680,598 L860,610" />
          <path className="road" d="M860,610 L800,680 L730,760" />
          <path className="road" d="M860,610 L852,536 L850,460" />
          <path className="road" d="M730,760 L860,705 L980,700 L1060,510" />
        </g>

        <g id="railways-layer">
          <path className="rail" d="M160,470 L350,400 L600,430 L850,460 L1060,510" />
          <path className="rail" d="M1060,510 L1230,720 L1280,430" />
          <path className="rail" d="M160,470 L160,170 L500,150 L860,280" />
          <path className="rail" d="M350,400 L480,570 L730,760" />
          <path className="rail" d="M730,760 L980,700 L1060,510" />
          <path className="rail" d="M600,430 L850,460" />
        </g>

        <g id="urban-layer">
          <circle cx="160" cy="470" r="55" fill="#d9d0c2" stroke="#5f584f" strokeWidth="1.6" />
          <circle cx="160" cy="470" r="38" fill="none" stroke="#5f584f" strokeWidth="1.2" />
        </g>

        <g id="cities-layer">
          {game.nodes.map((node) => {
            const isMajor = node.type === "city" || node.id === "paris_rail_hub";
            const xOffset = node.id === "paris" ? -40 : 10;
            const yOffset = node.id === "paris" ? 40 : -8;
            return (
              <g
                key={node.id}
                className={`map-city-node ${selectedNode === node.id ? "map-city-selected" : ""}`}
                data-node-id={node.id}
                onClick={(event) => onNodeSelect(node.id, { x: event.clientX, y: event.clientY })}
              >
                <circle className="map-city-hitbox" cx={node.point.x} cy={node.point.y} r={14} />
                <circle className={`map-city-dot ${isMajor ? "map-city-major" : "map-city-minor"}`} cx={node.point.x} cy={node.point.y} r={isMajor ? 8 : 6} pointerEvents="none" />
                <text className="map-city-label" x={node.point.x + xOffset} y={node.point.y + yOffset}>
                  {node.name}
                </text>
              </g>
            );
          })}
        </g>

        <g id="frontline-layer">
          <path
            className="frontline"
            d="M220,292 C285,302 335,312 390,325 C455,341 515,356 575,378 C640,400 705,424 770,451 C830,476 895,495 965,511 C1035,527 1100,531 1165,528"
          />
        </g>

        <g id="annotation-layer">
          <text className="map-sector-label" x="230" y="252">
            French sector
          </text>
          <text className="map-sector-label enemy" x="578" y="218">
            German sector
          </text>
        </g>

        <g id="dynamic-route-layer" pointerEvents="none">
          {game.units
            .filter((unit) => unit.role === "moving" && unit.movingTo)
            .map((unit) => {
              const from = nodePoint(game, unit.nodeId);
              const to = nodePoint(game, unit.movingTo as MapNodeId);
              return (
                <path
                  key={`route-${unit.id}`}
                  className={lineClass(unit.movementMode)}
                  d={pointListToPathD([from, to])}
                />
              );
            })}
        </g>

        <g id="dynamic-unit-layer" pointerEvents="none">
          {game.nodes.map((node) => {
            const units = grouped[node.id] ?? [];
            if (!units.length) return null;

            const allied = units.filter((unit) => unit.side === "allied");
            const german = units.filter((unit) => unit.side === "german");
            const renderGroup = (list: Unit[], dx: number) =>
              list.map((unit, index) => {
                const point = unitRenderPoint(game, unit);
                const visibleSquares = Math.min(12, Math.ceil(unit.strength));
                const rows = Math.ceil(visibleSquares / 4);
                const groupX = point.x + dx;
                const groupY = point.y + index * 18;

                return (
                  <g key={unit.id} transform={`translate(${groupX},${groupY})`}>
                    {Array.from({ length: visibleSquares }).map((_, sqIndex) => {
                      const col = sqIndex % 4;
                      const row = Math.floor(sqIndex / 4);
                      return (
                        <rect
                          key={sqIndex}
                          className={unitColorClass(unit.side)}
                          x={col * 5}
                          y={row * 5}
                          width={4}
                          height={4}
                        />
                      );
                    })}
                    <text className="unit-group-label" x={22} y={Math.max(12, rows * 5)}>
                      {unit.name} ({Math.round(unit.strength)})
                    </text>
                  </g>
                );
              });

            return (
              <g key={`units-${node.id}`}>
                {renderGroup(allied, -28)}
                {renderGroup(german, 10)}
              </g>
            );
          })}
        </g>
      </svg>
    </section>
  );
}
