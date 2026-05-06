import { getMovementOptions } from "@/lib/movement";
import { localGermanPowerRatio } from "@/lib/parisThreat";
import { clamp, makeId } from "@/lib/utils";
import { validateNodeId, validateUnitId } from "@/lib/validators";
import {
  AllowedAction,
  FrenchCommandParserOutput,
  GameState,
  GermanAgentOutput,
  MapNodeId,
  Order,
  ReportGeneratorInput,
  Unit
} from "@/types";

export type PublicEvent = ReportGeneratorInput["latestEvents"][number];

export function calculateTransmissionEfficiency(state: GameState): number {
  const command = state.commandCohesion / 100;
  const stability = state.cityStability / 100;
  const pressure = 1 - state.politicalPressure / 100;
  const threat = 1 - state.parisThreat / 100;
  const rail = 1 - state.railwayCongestion / 100;

  const weighted = command * 0.28 + stability * 0.2 + pressure * 0.18 + threat * 0.18 + rail * 0.16;
  return clamp(0.45 + weighted, 0.35, 1.35);
}

function orderTiming(action: AllowedAction, transmissionEfficiency: number): { delayMinutes: number; durationMinutes: number } {
  const efficiencyScale = clamp(transmissionEfficiency, 0.35, 1.35);
  const baseDelay = action === "OPTIMIZE_RAIL" ? 30 : action === "REDEPLOY" ? 20 : 10;
  const baseDuration = action === "OPTIMIZE_RAIL" ? 90 : 0;

  return {
    delayMinutes: Math.max(0, Math.round(baseDelay / efficiencyScale)),
    durationMinutes: baseDuration
  };
}

export function createOrderFromParserOutput(
  output: FrenchCommandParserOutput,
  currentTimeMinutes: number,
  state: GameState
): Order {
  const timing = orderTiming(output.action, calculateTransmissionEfficiency(state));
  return {
    id: makeId("order"),
    action: output.action,
    targetNodeId: output.targetNodeId ?? undefined,
    unitId: output.unitId ?? undefined,
    createdAtMinutes: currentTimeMinutes,
    delayMinutes: timing.delayMinutes,
    durationMinutes: timing.durationMinutes,
    status: "queued"
  };
}

function pickAlliedUnit(state: GameState, unitId?: string, nodeId?: MapNodeId): Unit | undefined {
  if (unitId) {
    return state.units.find((unit) => unit.id === unitId && unit.side === "allied");
  }

  if (nodeId) {
    return state.units.find(
      (unit) => unit.side === "allied" && unit.nodeId === nodeId && unit.strength > 0
    );
  }

  return state.units.find((unit) => unit.side === "allied" && unit.strength > 0);
}

function alliedNearParisUnits(state: GameState): Unit[] {
  const near = new Set<MapNodeId>(["paris", "paris_rail_hub", "ourcq_line", "meaux"]);
  return state.units.filter((unit) => unit.side === "allied" && near.has(unit.nodeId));
}

function isFrontNode(nodeId: MapNodeId): boolean {
  return nodeId === "ourcq_line" || nodeId === "meaux" || nodeId === "marne_crossings" || nodeId === "montmirail";
}

function resolveTravelPlan(
  state: GameState,
  unit: Unit,
  targetNodeId: MapNodeId
): { mode: Unit["movementMode"]; travelMinutes: number } {
  const options = getMovementOptions(unit.nodeId, targetNodeId, state, unit);
  const preferred = unit.movementMode ? options.find((option) => option.mode === unit.movementMode) : undefined;
  const best = preferred ?? options[0];
  if (!best) return { mode: "road", travelMinutes: 120 };
  return {
    mode: best.mode,
    travelMinutes: Math.max(20, Math.round(best.hours * 60))
  };
}

function applyOrderStart(state: GameState, order: Order): { event: string; publicEvent: PublicEvent } {
  const nodeId = validateNodeId(state, order.targetNodeId) ?? "paris";
  const unitId = validateUnitId(state, order.unitId);
  const unit = pickAlliedUnit(state, unitId, nodeId);

  switch (order.action) {
    case "DEFEND": {
      if (unit) {
        unit.stance = "defend";
        unit.entrenchment = clamp(unit.entrenchment + 4);
        unit.readiness = clamp(unit.readiness + 5);
        unit.fatigue = clamp(unit.fatigue + 1);
        unit.momentum = clamp(unit.momentum - 2);
      }
      return {
        event: `Defensive preparation ordered at ${nodeId}.`,
        publicEvent: {
          type: "defend_order",
          nodeId,
          unitIds: unit ? [unit.id] : [],
          resultSummary: "Allied units shifted toward prepared defensive posture."
        }
      };
    }

    case "DELAY": {
      if (unit) {
        unit.stance = "delay";
        unit.fatigue = clamp(unit.fatigue + 5);
        unit.supply = clamp(unit.supply - 4);
        unit.morale = clamp(unit.morale - 2);
      }
      state.germanOperationalMomentum = clamp(state.germanOperationalMomentum - 6);
      state.flankGap = clamp(state.flankGap + 4);

      return {
        event: `Delay action ordered near ${nodeId}.`,
        publicEvent: {
          type: "delay_order",
          nodeId,
          unitIds: unit ? [unit.id] : [],
          resultSummary: "Delaying maneuvers traded tempo for coordination pressure on German advance."
        }
      };
    }

    case "COUNTERATTACK": {
      if (unit) {
        unit.stance = "attack";
        unit.momentum = clamp(unit.momentum + 12);
        unit.readiness = clamp(unit.readiness + 6);
        unit.fatigue = clamp(unit.fatigue + 8);
        unit.supply = clamp(unit.supply - 8);
      }

      const ratio = 1 - localGermanPowerRatio(state, nodeId);
      const success = state.flankGap > 55 && ratio > 0.48;

      if (success) {
        state.germanOperationalMomentum = clamp(state.germanOperationalMomentum - 15);
        state.alliedOperationalMomentum = clamp(state.alliedOperationalMomentum + 12);
        state.flankGap = clamp(state.flankGap - 10);
        if (unit) unit.morale = clamp(unit.morale + 8);
        state.outcomeScores.tacticalGamble = clamp(state.outcomeScores.tacticalGamble + 15);
      } else if (unit) {
        unit.morale = clamp(unit.morale - 8);
        unit.cohesion = clamp(unit.cohesion - 8);
        state.politicalPressure = clamp(state.politicalPressure + 5);
      }

      return {
        event: success ? "Counterattack gained local advantage." : "Counterattack failed to achieve momentum.",
        publicEvent: {
          type: "counterattack_order",
          nodeId,
          unitIds: unit ? [unit.id] : [],
          resultSummary: success
            ? "Counterattack disrupted German tempo along the active flank."
            : "Counterattack met heavy resistance and strained cohesion."
        }
      };
    }

    case "REDEPLOY": {
      if (unit && nodeId) {
        const plan = resolveTravelPlan(state, unit, nodeId);

        unit.role = "moving";
        unit.movingTo = nodeId;
        unit.movementMode = plan.mode;
        unit.travelProgress = 0;
        unit.readiness = clamp(unit.readiness - 10);
        unit.fatigue = clamp(unit.fatigue + plan.travelMinutes / 40);
        unit.supply = clamp(unit.supply - plan.travelMinutes / 60);

        order.payload = {
          ...(order.payload ?? {}),
          travelMinutes: plan.travelMinutes,
          startMinutes: state.currentTimeMinutes,
          mode: plan.mode
        };
        order.durationMinutes = plan.travelMinutes;
      }

      return {
        event: `Redeploy order started toward ${nodeId}.`,
        publicEvent: {
          type: "redeploy_order",
          nodeId,
          unitIds: unit ? [unit.id] : [],
          resultSummary: "Redeployment initiated with transport route selection based on current logistics."
        }
      };
    }

    case "RECON": {
      state.intelligenceLevel = clamp(state.intelligenceLevel + 12);
      state.observedFlankGap = clamp(state.observedFlankGap + 15);
      if (state.flankGap > 55) {
        state.outcomeScores.tacticalGamble = clamp(state.outcomeScores.tacticalGamble + 5);
      }

      return {
        event: "Reconnaissance improved flank visibility.",
        publicEvent: {
          type: "recon_order",
          nodeId,
          resultSummary: "Recon assets improved visibility of German flank posture."
        }
      };
    }

    case "OPTIMIZE_RAIL": {
      return {
        event: "Rail optimization plan activated and awaiting completion.",
        publicEvent: {
          type: "rail_optimize_start",
          nodeId: "paris_rail_hub",
          resultSummary: "Rail timetable and priority reconfiguration started."
        }
      };
    }

    case "PROPAGANDA": {
      const factor = state.parisThreat > 85 ? 0.5 : 1;
      state.cityStability = clamp(state.cityStability + 8 * factor);
      state.politicalPressure = clamp(state.politicalPressure - 6 * factor);
      alliedNearParisUnits(state).forEach((allied) => {
        allied.morale = clamp(allied.morale + 3 * factor);
      });

      return {
        event: "Public morale campaign broadcast.",
        publicEvent: {
          type: "propaganda_order",
          nodeId: "paris",
          resultSummary: "Public messaging stabilized morale and local confidence."
        }
      };
    }

    case "MOBILIZE_CITY": {
      if (state.cityVehiclesDiscovered && state.cityVehiclesAvailable && unit) {
        state.cityVehiclesUsed = true;
        state.cityVehiclesAvailable = false;
        state.cityVehicleBoostUntilMinutes = state.currentTimeMinutes + 360;
        state.cityStability = clamp(state.cityStability - 8);
        state.politicalPressure = clamp(state.politicalPressure - 4);
        state.outcomeScores.miracleMarne = clamp(state.outcomeScores.miracleMarne + 15);

        unit.fatigue = clamp(unit.fatigue + 2);
        unit.readiness = clamp(unit.readiness + 5);
      }

      return {
        event: "Paris transport requisition activated.",
        publicEvent: {
          type: "urban_mobilization",
          nodeId: "paris",
          unitIds: unit ? [unit.id] : [],
          resultSummary: "Urban transport assets were requisitioned for near-Paris movement support."
        }
      };
    }

    case "INVALID_TO_CHAOS": {
      state.commandCohesion = clamp(state.commandCohesion - 8);
      state.politicalPressure = clamp(state.politicalPressure + 8);
      state.cityStability = clamp(state.cityStability - 4);
      state.outcomeScores.ahistoricalCollapse = clamp(state.outcomeScores.ahistoricalCollapse + 10);
      state.invalidCommandsInLast6Hours += 1;

      state.orderQueue.forEach((queued) => {
        if (queued.status === "queued") {
          queued.delayMinutes += 20;
        }
      });

      if (state.invalidCommandsInLast6Hours >= 3) {
        state.commandCohesion = clamp(state.commandCohesion - 15);
        state.outcomeScores.ahistoricalCollapse = clamp(state.outcomeScores.ahistoricalCollapse + 20);
      }

      return {
        event: "Unrealistic command degraded operational cohesion.",
        publicEvent: {
          type: "invalid_command",
          resultSummary: "Command ambiguity increased political and operational friction."
        }
      };
    }

    default:
      return {
        event: "Order received.",
        publicEvent: {
          type: "order",
          resultSummary: "Order queued."
        }
      };
  }
}

function applyOrderCompletion(state: GameState, order: Order): PublicEvent | null {
  if (order.action === "OPTIMIZE_RAIL") {
    state.railwayCongestion = clamp(state.railwayCongestion - 18);
    state.railCapacity = clamp(state.railCapacity + 15, 50, 130);
    state.commandCohesion = clamp(state.commandCohesion + 5);
    state.shortTermRedeployDelayMinutes += 15;
    state.outcomeScores.logisticsMaster = clamp(state.outcomeScores.logisticsMaster + 10);

    return {
      type: "rail_optimize_complete",
      nodeId: "paris_rail_hub",
      resultSummary: "Rail optimization completed; congestion eased and operational capacity improved."
    };
  }

  if (order.action === "REDEPLOY") {
    return {
      type: "redeploy_complete",
      nodeId: order.targetNodeId,
      unitIds: order.unitId ? [order.unitId] : [],
      resultSummary: "Redeployment order completed."
    };
  }

  return null;
}

export function processOrders(
  state: GameState
): { events: string[]; publicEvents: PublicEvent[] } {
  const events: string[] = [];
  const publicEvents: PublicEvent[] = [];

  for (const order of state.orderQueue) {
    if (order.status === "failed" || order.status === "completed") continue;

    if (order.status === "queued") {
      const dueAt = order.createdAtMinutes + order.delayMinutes;
      if (state.currentTimeMinutes >= dueAt) {
        order.status = "active";
        order.payload = {
          ...(order.payload ?? {}),
          activeSinceMinutes: state.currentTimeMinutes
        };

        const activation = applyOrderStart(state, order);
        events.push(activation.event);
        publicEvents.push(activation.publicEvent);

        if (order.durationMinutes <= 0) {
          order.status = "completed";
        }
      }
      continue;
    }

    if (order.status === "active") {
      const activeSince = Number(order.payload?.activeSinceMinutes ?? state.currentTimeMinutes);
      const finished = state.currentTimeMinutes >= activeSince + order.durationMinutes;
      if (finished) {
        order.status = "completed";
        const completion = applyOrderCompletion(state, order);
        if (completion) {
          events.push(`Order completed: ${order.action}`);
          publicEvents.push(completion);
        }
      }
    }
  }

  state.orderQueue = state.orderQueue.filter((order) => order.status !== "completed" && order.status !== "failed");
  return { events, publicEvents };
}

export function advanceMovingUnits(state: GameState, stepMinutes: number): PublicEvent[] {
  const events: PublicEvent[] = [];

  for (const unit of state.units) {
    if (unit.role !== "moving" || !unit.movingTo) continue;

    const order = state.orderQueue.find((item) => item.unitId === unit.id && item.action === "REDEPLOY");
    const travelMinutes =
      Number(order?.payload?.travelMinutes) ||
      resolveTravelPlan(state, unit, unit.movingTo).travelMinutes ||
      120;
    const progress = clamp((unit.travelProgress ?? 0) + stepMinutes / travelMinutes, 0, 1);
    unit.travelProgress = progress;

    if (progress >= 1) {
      unit.nodeId = unit.movingTo;
      unit.role = isFrontNode(unit.nodeId) ? "front" : "reserve";
      unit.readiness = Math.max(unit.readiness, 45);
      unit.movingTo = undefined;
      unit.movementMode = undefined;
      unit.travelProgress = undefined;

      const activeRedeploy = state.orderQueue.find(
        (item) => item.action === "REDEPLOY" && item.unitId === unit.id && item.status === "active"
      );
      if (activeRedeploy) {
        activeRedeploy.status = "completed";
      }

      events.push({
        type: "redeploy_arrival",
        nodeId: unit.nodeId,
        unitIds: [unit.id],
        resultSummary: `${unit.name} completed redeployment to ${unit.nodeId}.`
      });
    }
  }

  return events;
}

export function applyGermanIntent(
  state: GameState,
  intent: GermanAgentOutput
): { event: string; publicEvent: PublicEvent } {
  const units = state.units.filter((unit) => intent.unitIds.includes(unit.id) && unit.side === "german");

  const alreadyMovingToTarget = (unit: Unit): boolean =>
    unit.role === "moving" && Boolean(intent.targetNodeId) && unit.movingTo === intent.targetNodeId;

  if (intent.action === "ATTACK") {
    units.forEach((unit) => {
      unit.stance = "attack";
      unit.momentum = clamp(unit.momentum + 6);
      unit.readiness = clamp(unit.readiness + 4);
    });
    state.germanOperationalMomentum = clamp(state.germanOperationalMomentum + 5);
  } else if (intent.action === "REDEPLOY") {
    units.forEach((unit) => {
      unit.stance = "hold";
      if (alreadyMovingToTarget(unit)) {
        unit.momentum = clamp(unit.momentum - 2);
      } else if (intent.targetNodeId && intent.targetNodeId !== unit.nodeId) {
        const plan = resolveTravelPlan(state, unit, intent.targetNodeId);
        unit.role = "moving";
        unit.movingTo = intent.targetNodeId;
        unit.movementMode = plan.mode;
        unit.travelProgress = 0;
        unit.readiness = clamp(unit.readiness - 6);
        unit.fatigue = clamp(unit.fatigue + plan.travelMinutes / 55);
        unit.supply = clamp(unit.supply - plan.travelMinutes / 85);
      }
      unit.momentum = clamp(unit.momentum - 4);
    });
    state.germanOperationalMomentum = clamp(state.germanOperationalMomentum - 3);
    state.flankGap = clamp(state.flankGap - 4);
  } else if (intent.action === "ADVANCE") {
    units.forEach((unit) => {
      unit.stance = "attack";
      if (alreadyMovingToTarget(unit)) {
        unit.momentum = clamp(unit.momentum + 2);
      } else if (intent.targetNodeId && intent.targetNodeId !== unit.nodeId) {
        const plan = resolveTravelPlan(state, unit, intent.targetNodeId);
        unit.role = "moving";
        unit.movingTo = intent.targetNodeId;
        unit.movementMode = plan.mode;
        unit.travelProgress = 0;
        unit.readiness = clamp(unit.readiness - 5);
        unit.fatigue = clamp(unit.fatigue + plan.travelMinutes / 58);
        unit.supply = clamp(unit.supply - plan.travelMinutes / 90);
      }
    });
    state.germanOperationalMomentum = clamp(state.germanOperationalMomentum + 3);
    state.flankGap = clamp(state.flankGap + 2);
  } else if (intent.action === "CONSOLIDATE" || intent.action === "HOLD") {
    units.forEach((unit) => {
      unit.stance = "hold";
      unit.fatigue = clamp(unit.fatigue - 2);
      unit.supply = clamp(unit.supply + 2);
    });
    state.germanOperationalMomentum = clamp(state.germanOperationalMomentum - 2);
  } else {
    units.forEach((unit) => {
      unit.stance = "delay";
    });
  }

  return {
    event: `German intent executed: ${intent.action}.`,
    publicEvent: {
      type: `german_${intent.action.toLowerCase()}`,
      nodeId: intent.targetNodeId ?? undefined,
      unitIds: units.map((unit) => unit.id),
      resultSummary: `German forces executed ${intent.action.toLowerCase()} intent.`
    }
  };
}
