import { OrderItem, TickResult, GameStateData, KnowledgeCard } from "@/types";
import { commandToReport, driftToReport, buildAdviserLine, buildFriendlyLine, buildGermanLine } from "@/lib/reports";
import { resolveEnding, shouldEndGame } from "@/lib/outcome";
import { formatCampaignTime } from "@/lib/time";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function clampState(state: GameStateData): GameStateData {
  return {
    ...state,
    timeLeft: Math.max(0, state.timeLeft),
    parisThreat: clamp(state.parisThreat),
    germanAdvance: clamp(state.germanAdvance),
    flankGap: clamp(state.flankGap),
    morale: clamp(state.morale),
    fatigue: clamp(state.fatigue),
    supply: clamp(state.supply),
    railwayCongestion: clamp(state.railwayCongestion),
    redeployEfficiency: clamp(state.redeployEfficiency),
    cityStability: clamp(state.cityStability),
    politicalPressure: clamp(state.politicalPressure),
    commandCohesion: clamp(state.commandCohesion),
    counterattackMomentum: clamp(state.counterattackMomentum),
    pendingRailOptimizationTicks: Math.max(0, state.pendingRailOptimizationTicks),
    outcomeScores: {
      miracleMarne: clamp(state.outcomeScores.miracleMarne),
      logisticsMaster: clamp(state.outcomeScores.logisticsMaster),
      tacticalGamble: clamp(state.outcomeScores.tacticalGamble),
      costlyStalemate: clamp(state.outcomeScores.costlyStalemate),
      parisPoliticalCrisis: clamp(state.outcomeScores.parisPoliticalCrisis),
      germanBreakthrough: clamp(state.outcomeScores.germanBreakthrough),
      ahistoricalCollapse: clamp(state.outcomeScores.ahistoricalCollapse)
    }
  };
}

function pushCard(cards: KnowledgeCard[], key: string, title: string, body: string): void {
  cards.push({
    id: `card-${key}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    key,
    title,
    body
  });
}

interface TickOptions {
  gameHoursDelta: number;
  orderSlots: number;
}

export function aiTick(current: GameStateData, queue: OrderItem[], tick: number, options: TickOptions): TickResult {
  const before = { ...current, outcomeScores: { ...current.outcomeScores } };
  const next = { ...before, outcomeScores: { ...before.outcomeScores } };
  const consumedOrders: string[] = [];

  const reports = [];
  const cards: KnowledgeCard[] = [];
  const agentLines = [buildAdviserLine(tick)];

  const hoursDelta = options.gameHoursDelta;
  const tickScale = hoursDelta / 0.5;

  // Baseline drift (no-operation simulation)
  next.timeLeft -= hoursDelta;
  next.currentTime += hoursDelta * 60 * 60 * 1000;

  let deltaGermanAdvance = 2;
  if (next.supply < 40) deltaGermanAdvance -= 1;
  if (next.fatigue > 80) deltaGermanAdvance -= 1;
  if (next.flankGap > 50) deltaGermanAdvance -= 1;
  deltaGermanAdvance = Math.max(0, Math.min(3, deltaGermanAdvance));
  next.germanAdvance += deltaGermanAdvance * tickScale;

  let deltaParisThreat = 1.5;
  if (next.germanAdvance > 80) deltaParisThreat += 1;
  if (next.morale < 40) deltaParisThreat += 1;
  if (next.cityStability < 40) deltaParisThreat += 1;
  next.parisThreat += deltaParisThreat * tickScale;

  next.fatigue += 1 * tickScale;

  let moraleDrift = -0.5;
  if (next.parisThreat > 80) moraleDrift -= 1;
  if (next.commandCohesion < 50) moraleDrift -= 1;
  if (next.fatigue > 85) moraleDrift -= 1;
  next.morale += moraleDrift * tickScale;

  next.railwayCongestion += 1 * tickScale;
  if (next.railwayCongestion > 85) {
    next.redeployEfficiency = 70;
  }

  let flankDrift = next.germanAdvance > 70 ? 3 : 1;
  if (next.supply < 50) flankDrift += 1;
  next.flankGap += flankDrift * tickScale;

  if (next.pendingRailOptimizationTicks > 0) {
    next.pendingRailOptimizationTicks -= 1;
    if (next.pendingRailOptimizationTicks <= 0) {
      next.railwayCongestion -= 15;
      next.redeployEfficiency = Math.min(120, next.redeployEfficiency + 20);
      agentLines.push(buildFriendlyLine("Rail optimization orders took effect across priority corridors."));
    }
  }

  const ordersToApply = queue.slice(0, Math.max(0, options.orderSlots));

  for (const order of ordersToApply) {
    consumedOrders.push(order.id);

    switch (order.command.action) {
      case "DEFEND": {
        let defendThreatReduction = 12;
        if (next.railwayCongestion > 80) defendThreatReduction *= 0.5;
        if (next.commandCohesion < 50) defendThreatReduction *= 0.7;
        next.parisThreat -= defendThreatReduction;
        next.morale += 3;
        next.fatigue += 2;
        next.supply -= 2;
        break;
      }

      case "DELAY": {
        next.germanAdvance -= 8;
        next.fatigue += 3;
        next.morale -= 2;
        if (next.fatigue > 80) next.morale -= 2;
        break;
      }

      case "COUNTERATTACK": {
        if (next.flankGap > 50) {
          next.germanAdvance -= 15;
          next.morale += 8;
          next.flankGap -= 20;
          next.counterattackMomentum += 20;
          next.counterattackSuccess = true;
          next.outcomeScores.tacticalGamble += 20;
        } else {
          next.morale -= 10;
          next.parisThreat += 5;
        }
        break;
      }

      case "OPTIMIZE_RAIL": {
        next.pendingRailOptimizationTicks = Math.max(next.pendingRailOptimizationTicks, 2);
        next.outcomeScores.logisticsMaster += 10;
        break;
      }

      case "RECON": {
        next.flankGap += 10;
        break;
      }

      case "PROPAGANDA": {
        const factor = next.parisThreat > 80 ? 0.5 : 1;
        next.morale += 5 * factor;
        next.cityStability += 5 * factor;
        break;
      }

      case "MOBILIZE_CITY": {
        if (next.parisThreat > 72) {
          next.parisThreat -= 20;
          next.morale += 10;
          next.cityStability -= 8;
          next.cityVehiclesUsed = true;
          next.outcomeScores.miracleMarne += 20;
        }
        break;
      }

      case "INVALID_TO_CHAOS": {
        next.commandCohesion -= 10;
        next.morale -= 5;
        next.germanAdvance += 4;
        next.politicalPressure += 8;
        next.outcomeScores.ahistoricalCollapse += 12;
        pushCard(
          cards,
          "historical-boundary",
          "Historical Constraints",
          "Unrealistic directives degrade coordination and increase battlefield chaos."
        );
        break;
      }

      default:
        break;
    }

    reports.push(commandToReport(order.command, tick, formatCampaignTime(next.timeLeft)));
    agentLines.push(buildFriendlyLine(`Order ${order.command.action} was executed.`));
  }

  if (next.flankGap > 60) {
    pushCard(
      cards,
      "flank-gap",
      "Flank Gap",
      "The widening gap on the German right can create a narrow counterattack window."
    );
  }

  if (next.railwayCongestion > 80) {
    pushCard(
      cards,
      "railway-congestion",
      "Railway Mobilization",
      "Overloaded rail corridors delay redeployment and reduce operational efficiency."
    );
  }

  if (next.cityVehiclesUsed) {
    pushCard(
      cards,
      "city-vehicles",
      "City Vehicles and Symbolism",
      "Emergency city transport can buy critical time and raise morale under pressure."
    );
  }

  if (next.parisThreat >= 90 || next.germanAdvance >= 90) {
    next.outcomeScores.germanBreakthrough += 3 * tickScale;
    next.outcomeScores.parisPoliticalCrisis += 2 * tickScale;
    agentLines.push(buildGermanLine("Pressure on the capital axis is intensifying rapidly."));
  } else {
    agentLines.push(buildGermanLine("German pressure remains steady across the front."));
  }

  reports.push(driftToReport(before, next, tick, formatCampaignTime(next.timeLeft)));

  const clamped = clampState(next);
  if (shouldEndGame(clamped)) {
    clamped.ending = resolveEnding(clamped);
  }

  return {
    nextState: clamped,
    consumedOrders,
    artifacts: {
      reports,
      cards,
      agentLines
    }
  };
}
