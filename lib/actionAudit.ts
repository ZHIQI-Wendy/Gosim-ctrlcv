import { GameState, Unit } from "@/types";
import { PublicEvent } from "@/lib/orders";

function unitPosition(unit: Unit): string {
  if (unit.role === "moving" && unit.movingTo) {
    return `${unit.nodeId}->${unit.movingTo}`;
  }
  return unit.nodeId;
}

function troopSnapshot(state: GameState): string {
  return state.units
    .map(
      (unit) =>
        `${unit.name}=${Math.round(unit.strength)}|${unit.role}/${unit.stance}|${unitPosition(unit)}`
    )
    .join("; ");
}

function sanitize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function buildActionAuditLine(state: GameState, action: string, actionParams: string): string {
  return sanitize(
    [
      `datetime=${new Date().toISOString()}`,
      `action=${action}`,
      `params=${actionParams}`,
      `paris_threat=${state.parisThreat.toFixed(1)}`,
      `command_cohesion=${state.commandCohesion.toFixed(1)}`,
      `city_stability=${state.cityStability.toFixed(1)}`,
      `political_pressure=${state.politicalPressure.toFixed(1)}`,
      `rail_congestion=${state.railwayCongestion.toFixed(1)}`,
      `troops=${troopSnapshot(state)}`
    ].join(" | ")
  );
}

export function buildAuditLinesFromPublicEvents(state: GameState, publicEvents: PublicEvent[]): string[] {
  return publicEvents
    .filter((event) => {
      const type = event.type.toLowerCase();
      return (
        type.includes("_order") ||
        type.includes("urban_mobilization") ||
        type.includes("german_") ||
        type.includes("government_decision") ||
        type.includes("rail_optimize_start")
      );
    })
    .map((event) => {
      const params = [
        event.nodeId ? `node=${event.nodeId}` : "",
        event.unitIds?.length ? `units=${event.unitIds.join(",")}` : "",
        `summary=${event.resultSummary}`
      ]
        .filter(Boolean)
        .join(", ");

      return buildActionAuditLine(state, event.type, params);
    });
}

export async function postActionAuditLines(lines: string[]): Promise<void> {
  if (lines.length === 0) return;

  await fetch("/api/review-log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ lines })
  });
}
