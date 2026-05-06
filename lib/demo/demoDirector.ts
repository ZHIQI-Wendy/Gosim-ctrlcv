import {
  DirectorInput,
  DirectorOutput,
  FrenchCommandParserInput,
  FrenchCommandParserOutput,
  GermanAgentInput,
  GermanAgentOutput,
  GovernmentDecisionInput,
  GovernmentDecisionOutput,
  ReportGeneratorInput,
  ReportGeneratorOutput
} from "@/types";

export function isDemoDirectorEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_AUTORUN === "1";
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/^\s*/i, "").replace(/\s+/g, " ").trim();
}

export function getDemoFrenchDecision(input: FrenchCommandParserInput): FrenchCommandParserOutput | null {
  const text = normalize(input.rawText);

  if (text.includes("move fifth army to meaux")) {
    return {
      action: "REDEPLOY",
      targetNodeId: "meaux",
      unitId: "fifth_army",
      urgency: "high",
      riskTolerance: "medium",
      constraints: {
        avoidHeavyLosses: true,
        preserveParis: true,
        preserveReserves: false,
        prioritizeSpeed: true
      },
      historicalValidity: "high",
      ambiguity: "none",
      mappedOrderText: "Move Fifth Army to Meaux.",
      explanation: "Scripted demo parser output for a direct redeployment order.",
      sourceGameTimeMinutes: input.visibleState.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  if (text.includes("counterattack") && text.includes("meaux")) {
    return {
      action: "COUNTERATTACK",
      targetNodeId: "meaux",
      unitId: "fifth_army",
      urgency: "high",
      riskTolerance: "high",
      constraints: {
        avoidHeavyLosses: false,
        preserveParis: true,
        preserveReserves: false,
        prioritizeSpeed: false
      },
      historicalValidity: "high",
      ambiguity: "none",
      mappedOrderText: "Fifth Army counterattacks at Meaux.",
      explanation: "Scripted demo parser output for a local counterattack.",
      sourceGameTimeMinutes: input.visibleState.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  if (text.includes("attack german forces at meaux again")) {
    return {
      action: "COUNTERATTACK",
      targetNodeId: "meaux",
      unitId: "fifth_army",
      urgency: "high",
      riskTolerance: "high",
      constraints: {
        avoidHeavyLosses: false,
        preserveParis: true,
        preserveReserves: false,
        prioritizeSpeed: false
      },
      historicalValidity: "high",
      ambiguity: "none",
      mappedOrderText: "Renew the attack at Meaux.",
      explanation: "Scripted demo parser output for repeated pressure at Meaux.",
      sourceGameTimeMinutes: input.visibleState.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  if (text.includes("use taxi") && text.includes("sixth army")) {
    return {
      action: input.visibleState.cityVehiclesDiscovered ? "MOBILIZE_CITY" : "RECON",
      targetNodeId: "paris",
      unitId: "sixth_army",
      urgency: "high",
      riskTolerance: "medium",
      constraints: {
        avoidHeavyLosses: true,
        preserveParis: true,
        preserveReserves: false,
        prioritizeSpeed: true
      },
      historicalValidity: "high",
      ambiguity: "low",
      mappedOrderText: "Mobilize Paris taxis for Sixth Army movement.",
      explanation: "Scripted demo parser output for taxi mobilization.",
      sourceGameTimeMinutes: input.visibleState.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  if (text.includes("sixth army attack") && text.includes("marne")) {
    return {
      action: "COUNTERATTACK",
      targetNodeId: "marne_crossings",
      unitId: "sixth_army",
      urgency: "high",
      riskTolerance: "high",
      constraints: {
        avoidHeavyLosses: false,
        preserveParis: true,
        preserveReserves: false,
        prioritizeSpeed: false
      },
      historicalValidity: "high",
      ambiguity: "none",
      mappedOrderText: "Sixth Army attacks at the Marne crossings.",
      explanation: "Scripted demo parser output for the Marne attack.",
      sourceGameTimeMinutes: input.visibleState.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  return null;
}

export function getDemoGermanDecision(input: GermanAgentInput): GermanAgentOutput | null {
  const t = input.currentTimeMinutes;

  if (t < 600) {
    return {
      action: "ADVANCE",
      targetNodeId: "meaux",
      unitIds: ["german_cavalry_screen"],
      stance: "balanced",
      intensity: "medium",
      expectedEffect: { targetPressure: 5, supplyRisk: 2, flankRisk: 3 },
      confidence: 0.82,
      rationale: "Scripted demo move toward Meaux.",
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  if (t < 1200) {
    return {
      action: "ATTACK",
      targetNodeId: "meaux",
      unitIds: ["german_cavalry_screen"],
      stance: "aggressive",
      intensity: "medium",
      expectedEffect: { targetPressure: 8, supplyRisk: 3, flankRisk: 5 },
      confidence: 0.8,
      rationale: "Scripted demo contest at Meaux.",
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  if (t < 1800) {
    return {
      action: "REDEPLOY",
      targetNodeId: "epernay",
      unitIds: ["german_second_army"],
      stance: "cautious",
      intensity: "medium",
      expectedEffect: { targetPressure: 2, supplyRisk: 1, flankRisk: -4 },
      confidence: 0.84,
      rationale: "Scripted demo shift toward Epernay.",
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  if (t < 2400) {
    return {
      action: "ADVANCE",
      targetNodeId: "marne_crossings",
      unitIds: ["german_second_army"],
      stance: "balanced",
      intensity: "medium",
      expectedEffect: { targetPressure: 7, supplyRisk: 4, flankRisk: 2 },
      confidence: 0.83,
      rationale: "Scripted demo push to the Marne.",
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  if (t < 3000) {
    return {
      action: "HOLD",
      targetNodeId: "marne_crossings",
      unitIds: ["german_second_army"],
      stance: "cautious",
      intensity: "low",
      expectedEffect: { targetPressure: 1, supplyRisk: -2, flankRisk: -1 },
      confidence: 0.78,
      rationale: "Scripted demo no-move beat before the French attack.",
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  if (t < 3600) {
    return {
      action: "REDEPLOY",
      targetNodeId: "reims",
      unitIds: ["german_second_army"],
      stance: "cautious",
      intensity: "medium",
      expectedEffect: { targetPressure: -6, supplyRisk: -3, flankRisk: -6 },
      confidence: 0.88,
      rationale: "Scripted demo withdrawal toward Reims.",
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  return {
    action: "HOLD",
    targetNodeId: "reims",
    unitIds: ["german_second_army"],
    stance: "cautious",
    intensity: "low",
    expectedEffect: { targetPressure: -1, supplyRisk: -2, flankRisk: -2 },
    confidence: 0.75,
    rationale: "Scripted demo end state hold.",
    sourceGameTimeMinutes: input.currentTimeMinutes,
    sourceStateVersion: input.sourceStateVersion
  };
}

export function getDemoGovernmentDecision(_input: GovernmentDecisionInput): GovernmentDecisionOutput | null {
  return {
    trigger: false,
    action: "NO_ACTION",
    publicMessage: "Cabinet monitoring continues without formal intervention.",
    stateDelta: {
      cityStability: 0,
      politicalPressure: 0,
      commandCohesion: 0,
      governmentCollapseRisk: 0,
      alliedOperationalMomentum: 0
    },
    durationMinutes: 0,
    severity: "minor",
    confidence: 0.8,
    privateRationale: "Demo controller leaves political state to the military script unless thresholds force change.",
    sourceGameTimeMinutes: _input.currentTimeMinutes,
    sourceStateVersion: _input.sourceStateVersion
  };
}

export function getDemoDirectorDecision(input: DirectorInput): DirectorOutput | null {
  const combatContext = input.combatContext;
  return {
    trigger: Boolean(combatContext) || input.publicState.parisThreat > 75,
    action: combatContext ? "COMBAT_FRICTION" : "EMERGENCY_DIRECTIVE",
    publicMessage: combatContext
      ? `Director notes combat friction around ${combatContext.nodeId}.`
      : "Director issues a stabilizing operational directive.",
    stateDelta: {
      cityStability: combatContext ? -1 : 2,
      politicalPressure: combatContext ? 1 : -2,
      commandCohesion: combatContext ? -1 : 2,
      governmentCollapseRisk: combatContext ? 1 : -3,
      alliedOperationalMomentum: combatContext ? 0 : 1,
      germanOperationalMomentum: combatContext ? 1 : 0,
      railwayCongestion: combatContext ? 3 : -1,
      shortTermRedeployDelayMinutes: combatContext ? 10 : 0
    },
    unitDelta: [],
    nodeDelta: combatContext
      ? [
          {
            nodeId: combatContext.nodeId,
            controlPressureDelta: -2,
            defenseValueDelta: 0,
            supplyValueDelta: 0,
            transportValueDelta: -1
          }
        ]
      : [],
    severity: combatContext ? "medium" : "minor",
    confidence: 0.82,
    privateRationale: "Demo director merges political and local friction logic.",
    sourceGameTimeMinutes: input.currentTimeMinutes,
    sourceStateVersion: input.sourceStateVersion
  };
}

export function getDemoReportDecision(input: ReportGeneratorInput): ReportGeneratorOutput | null {
  const latest = input.latestEvents[input.latestEvents.length - 1];
  const t = input.currentTimeMinutes;

  if (t >= 1700 && t < 2300 && !input.latestEvents.some((event) => event.type === "urban_mobilization")) {
    return {
      headline: "Paris Transport Watch",
      reportText: "Taxi services are still running normally in Paris, though the roads are under visible military strain.",
      advisorLine: "Civil traffic remains usable, but command must act before the transport window closes.",
      knowledgeHint: "Urban transport matters most when rail timing is already under pressure.",
      privateRationale: "Scripted pre-mobilization taxi report for demo mode.",
      shouldReport: true,
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  if (latest?.type === "urban_mobilization") {
    return {
      headline: "Paris Taxis Mobilized",
      reportText: "Taxis from Paris have been requisitioned to support rapid local troop movement toward the threatened front.",
      advisorLine: "The symbolic effect may be nearly as important as the direct movement benefit.",
      knowledgeHint: "Short-distance urban transport can compress reaction time around Paris.",
      privateRationale: "Scripted demo report for taxi mobilization.",
      shouldReport: true,
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  if (latest?.type === "german_redeploy" && latest.nodeId === "reims") {
    return {
      headline: "German Retreat Toward Reims",
      reportText: "German formations are observed falling back toward Reims as pressure along the Marne line eases.",
      advisorLine: "Exploit the operational pause, but avoid reckless pursuit.",
      knowledgeHint: "A retreat can reduce immediate threat without ending the wider campaign.",
      privateRationale: "Scripted demo withdrawal report.",
      shouldReport: true,
      sourceGameTimeMinutes: input.currentTimeMinutes,
      sourceStateVersion: input.sourceStateVersion
    };
  }

  return null;
}
