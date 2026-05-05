import { AgentLine, BattleReport, ClassifiedCommand, GameStateData } from "@/types";

export function commandToReport(command: ClassifiedCommand, tick: number, dateLabel: string): BattleReport {
  return {
    id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tick,
    title: `Order Executed: ${command.action}`,
    body: command.report,
    dateLabel
  };
}

export function driftToReport(before: GameStateData, after: GameStateData, tick: number, dateLabel: string): BattleReport {
  const pressure = after.parisThreat - before.parisThreat;
  const advance = after.germanAdvance - before.germanAdvance;
  return {
    id: `drift-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tick,
    title: "Frontline Situation",
    body: `German advance changed by ${advance.toFixed(2)}. Paris threat changed by ${pressure.toFixed(2)}. Time remaining: ${after.timeLeft.toFixed(2)} hours.`,
    dateLabel
  };
}

const adviserHints = [
  "Rail lines are saturated. Urban transport depth may matter more than raw troop count.",
  "Our central problem is time, not manpower.",
  "The German right wing is outrunning its own command spacing."
];

export function buildAdviserLine(seed: number): AgentLine {
  return {
    id: `adviser-${Date.now()}-${seed}`,
    speaker: "Adviser",
    text: adviserHints[seed % adviserHints.length]
  };
}

export function buildFriendlyLine(text: string): AgentLine {
  return {
    id: `friendly-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    speaker: "Friendly HQ",
    text
  };
}

export function buildGermanLine(text: string): AgentLine {
  return {
    id: `german-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    speaker: "German HQ",
    text
  };
}
