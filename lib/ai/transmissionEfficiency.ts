import { GAME_CONFIG } from "@/lib/config/gameConfig";

export type TransmissionEfficiencyFactors = {
  parisThreat: number; // 0-100
  commandCohesion: number; // typically -20 to 20
  cityStability: number; // typically 0-100
  politicalPressure: number; // typically 0-100
  railwayCongestion: number; // typically 0-100
};

export type TransmissionEfficiency = {
  score: number; // 0-1
  level: "critical" | "degraded" | "optimal";
  frenchCommandProcessingIntervalMinutes: number;
  germanDecisionIntervalMinutes: number;
  orderTransmissionDelayMinutes: number;
  rationale: string;
};

/**
 * Calculate transmission efficiency based on game state factors.
 * Efficiency represents how quickly agents can process decisions and transmit orders.
 *
 * Low efficiency (crisis conditions):
 * - High Paris threat
 * - Low command cohesion
 * - Low city stability
 * - High political pressure
 * - High railway congestion
 *
 * High efficiency (optimal conditions):
 * - Low Paris threat
 * - High command cohesion
 * - High city stability
 * - Low political pressure
 * - Low railway congestion
 */
export function calculateTransmissionEfficiency(
  factors: TransmissionEfficiencyFactors
): TransmissionEfficiency {
  const normalizedThreat = Math.min(100, Math.max(0, factors.parisThreat)) / 100;
  const normalizedCohesion = Math.min(100, Math.max(0, factors.commandCohesion)) / 100;
  const normalizedStability = Math.min(100, Math.max(0, factors.cityStability)) / 100;
  const normalizedPressure = Math.min(100, Math.max(0, factors.politicalPressure)) / 100;
  const normalizedCongestion = Math.min(100, Math.max(0, factors.railwayCongestion)) / 100;

  const score = Math.min(
    1,
    Math.max(
      0,
      normalizedCohesion * 0.28 +
        normalizedStability * 0.22 +
        (1 - normalizedPressure) * 0.18 +
        (1 - normalizedThreat) * 0.18 +
        (1 - normalizedCongestion) * 0.14
    )
  );

  // Determine efficiency level
  let level: "critical" | "degraded" | "optimal";
  if (score < GAME_CONFIG.transmissionEffCriticalThreshold / 100) {
    level = "critical";
  } else if (score < GAME_CONFIG.transmissionEffDegradedThreshold / 100) {
    level = "degraded";
  } else {
    level = "optimal";
  }

  // Calculate processing intervals based on efficiency
  // Lower efficiency = longer intervals (slower decision-making)
  const slowdownMultiplier = 1 + (1 - score) * 1.5;
  const frenchCommandProcessingIntervalMinutes = Math.max(10, Math.round(GAME_CONFIG.frenchCycleMinutes * slowdownMultiplier));
  const germanDecisionIntervalMinutes = Math.max(15, Math.round(GAME_CONFIG.germanCycleMinutes * slowdownMultiplier));
  const delayMultiplier = 1 + (1 - score) * 2;
  const orderTransmissionDelayMinutes = Math.min(
    GAME_CONFIG.frenchOrderTransmissionDelayMax,
    Math.round(GAME_CONFIG.frenchOrderTransmissionDelayBase * delayMultiplier)
  );

  // Generate rationale
  const rationale = generateEfficiencyRationale(level, factors);

  return {
    score,
    level,
    frenchCommandProcessingIntervalMinutes,
    germanDecisionIntervalMinutes,
    orderTransmissionDelayMinutes,
    rationale
  };
}

function generateEfficiencyRationale(
  level: "critical" | "degraded" | "optimal",
  factors: TransmissionEfficiencyFactors
): string {
  const issues: string[] = [];

  if (factors.parisThreat > 80) {
    issues.push("extreme Paris threat");
  } else if (factors.parisThreat > 70) {
    issues.push("elevated Paris threat");
  }

  if (factors.commandCohesion < 35) {
    issues.push("severe command cohesion loss");
  } else if (factors.commandCohesion < 55) {
    issues.push("command cohesion strain");
  }

  if (factors.cityStability < 40) {
    issues.push("critical city instability");
  } else if (factors.cityStability < 60) {
    issues.push("city stability concerns");
  }

  if (factors.politicalPressure > 80) {
    issues.push("extreme political pressure");
  } else if (factors.politicalPressure > 60) {
    issues.push("significant political pressure");
  }

  if (factors.railwayCongestion > 80) {
    issues.push("severe railway congestion");
  } else if (factors.railwayCongestion > 60) {
    issues.push("railway congestion");
  }

  if (issues.length === 0) {
    return "Optimal transmission conditions.";
  }

  return `Transmission degraded by: ${issues.join(", ")}.`;
}
