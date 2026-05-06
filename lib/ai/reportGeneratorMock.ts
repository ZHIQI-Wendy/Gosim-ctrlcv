import { ReportGeneratorInput, ReportGeneratorOutput } from "@/types";

export function reportGeneratorMock(input: ReportGeneratorInput): ReportGeneratorOutput {
  const latest = input.latestEvents[input.latestEvents.length - 1];

  const threatBand =
    input.publicState.parisThreat > 85
      ? "critical"
      : input.publicState.parisThreat > 70
      ? "severe"
      : input.publicState.parisThreat > 55
      ? "elevated"
      : "contained";

  const headline = latest
    ? `Situation: ${latest.type.replace(/_/g, " ")}`
    : "Situation: Frontline Monitoring";

  const reportText = latest
    ? `${latest.resultSummary} Paris threat is now ${threatBand}. Railway congestion at ${Math.round(
        input.publicState.railwayCongestion
      )}.`
    : `No major public event. Paris threat remains ${threatBand}, with pressure concentrated on approach routes.`;

  const advisorLine =
    input.publicState.observedFlankGap > 45
      ? "Observed flank gap is widening. A timed counterstroke may become viable."
      : "Keep order cadence stable; fragmented directives will cost more than inaction.";

  const knowledgeHint =
    input.publicState.railwayCongestion > 80
      ? "Rail congestion can buy strategic delay for the enemy if uncorrected."
      : "Command cohesion and urban confidence are as decisive as raw strength.";

  return {
    headline,
    reportText,
    advisorLine,
    knowledgeHint,
    privateRationale: "Summarized latest public events while avoiding hidden-state disclosure."
  };
}
