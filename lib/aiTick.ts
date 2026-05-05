import { OrderItem, TickResult, GameStateData, CommandEffects, KnowledgeCard } from "@/types";
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
    cityStability: clamp(state.cityStability),
    politicalPressure: clamp(state.politicalPressure),
    commandCohesion: clamp(state.commandCohesion),
    counterattackMomentum: clamp(state.counterattackMomentum),
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

function applyEffects(target: GameStateData, effects: CommandEffects, factor: number): void {
  if (effects.parisThreat) target.parisThreat += effects.parisThreat * factor;
  if (effects.germanAdvance) target.germanAdvance += effects.germanAdvance * factor;
  if (effects.flankGap) target.flankGap += effects.flankGap * factor;
  if (effects.morale) target.morale += effects.morale * factor;
  if (effects.fatigue) target.fatigue += effects.fatigue * factor;
  if (effects.supply) target.supply += effects.supply * factor;
  if (effects.railwayCongestion) target.railwayCongestion += effects.railwayCongestion * factor;
  if (effects.cityStability) target.cityStability += effects.cityStability * factor;
  if (effects.politicalPressure) target.politicalPressure += effects.politicalPressure * factor;
  if (effects.commandCohesion) target.commandCohesion += effects.commandCohesion * factor;
  if (effects.counterattackMomentum) target.counterattackMomentum += effects.counterattackMomentum * factor;

  if (effects.scores) {
    for (const key of Object.keys(effects.scores) as Array<keyof GameStateData["outcomeScores"]>) {
      const value = effects.scores[key] ?? 0;
      target.outcomeScores[key] += value * factor;
    }
  }
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
  const fatigueTimePenalty = next.fatigue > 70 ? 1.15 : 1;

  next.timeLeft -= hoursDelta * fatigueTimePenalty;
  next.germanAdvance += 2 * hoursDelta;
  next.parisThreat += 1 * hoursDelta;
  next.fatigue += 1 * hoursDelta;
  next.supply -= 1 * hoursDelta;

  if (next.railwayCongestion > 70) {
    next.supply -= 1 * hoursDelta;
    next.commandCohesion -= 1 * hoursDelta;
  }

  if (next.flankGap > 60) {
    next.germanAdvance -= 1 * hoursDelta;
    next.outcomeScores.tacticalGamble += 2 * hoursDelta;
  }

  if (next.morale > 65) {
    next.parisThreat -= 1 * hoursDelta;
  }

  if (next.commandCohesion < 40) {
    next.parisThreat += 2 * hoursDelta;
  }

  const ordersToApply = queue.slice(0, Math.max(0, options.orderSlots));

  for (const order of ordersToApply) {
    consumedOrders.push(order.id);

    const cohesionFactor = next.commandCohesion / 100;
    const supplyFactor = next.supply / 100;
    const railPenalty = next.railwayCongestion > 80 ? 0.2 : 0;
    const efficiency = clamp(0.3 + cohesionFactor * 0.45 + supplyFactor * 0.45 - railPenalty, 0.35, 1.15);

    applyEffects(next, order.command.effects, efficiency);

    if (order.command.action === "MOBILIZE_CITY") {
      next.cityVehiclesUsed = true;
    }

    if (order.command.action === "COUNTERATTACK" && next.flankGap > 65) {
      next.outcomeScores.tacticalGamble += 6;
    }

    if (order.command.action === "INVALID_TO_CHAOS") {
      pushCard(
        cards,
        "historical-boundary",
        "Historical Constraints",
        "Command intent still obeys real political and military limits. Unrealistic directives cause confusion, not miracles."
      );
      next.outcomeScores.ahistoricalCollapse += 8;
    }

    reports.push(commandToReport(order.command, tick, formatCampaignTime(next.timeLeft)));
    agentLines.push(buildFriendlyLine(`Order ${order.command.action} was executed with efficiency ${Math.round(efficiency * 100)}%.`));
  }

  let germanPush = 2 * hoursDelta;
  if (next.supply < 25) germanPush -= 1 * hoursDelta;
  if (next.flankGap > 55) {
    germanPush += 1 * hoursDelta;
    next.outcomeScores.tacticalGamble += 1 * hoursDelta;
  }

  if (next.flankGap > 80) {
    next.germanAdvance += 1 * hoursDelta;
    next.parisThreat += 1 * hoursDelta;
    agentLines.push(buildGermanLine("Forward corps overruns local schedules and pushes aggressively despite widening command distance."));
  } else {
    agentLines.push(buildGermanLine("Operational push continues toward Paris with high tempo."));
  }

  next.germanAdvance += germanPush;
  next.parisThreat += germanPush / 2;
  next.outcomeScores.germanBreakthrough += germanPush > 2 * hoursDelta ? 2 * hoursDelta : 1 * hoursDelta;

  if (next.morale > 55 && next.supply > 35) {
    next.parisThreat -= 2 * hoursDelta;
    agentLines.push(buildFriendlyLine("Defensive discipline is holding key approaches to Paris."));
  }

  if (next.fatigue > 85) {
    next.morale -= 2 * hoursDelta;
    next.outcomeScores.costlyStalemate += 2 * hoursDelta;
  }

  if (next.railwayCongestion > 80) {
    pushCard(
      cards,
      "railway-congestion",
      "Railway Mobilization",
      "In 1914, rail timetables were strategic weapons. Congestion could delay entire corps at critical hours."
    );
  }

  if (next.flankGap > 60) {
    pushCard(
      cards,
      "flank-gap",
      "Flank Gap",
      "At the Marne, widening command distance on the German right created operational vulnerability."
    );
  }

  if (next.cityVehiclesUsed) {
    pushCard(
      cards,
      "city-vehicles",
      "City Vehicles and Symbolism",
      "The military impact of Paris taxis was limited, but the symbolism of civic mobilization was powerful."
    );
  }

  if (next.parisThreat > 85) {
    pushCard(
      cards,
      "paris-pressure",
      "Paris Under Pressure",
      "Paris mattered as a political and psychological center as much as a geographic objective."
    );
    next.outcomeScores.parisPoliticalCrisis += 3 * hoursDelta;
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
