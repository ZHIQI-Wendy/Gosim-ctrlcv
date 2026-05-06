import { buildOrderContext } from "@/lib/ai/context/buildOrderContext";
import { GermanAgentInput, GameState } from "@/types";

export function buildGermanCommanderContext(state: GameState, recentEvents: string[] = []): GermanAgentInput {
  const orderContext = buildOrderContext(state);
  const germanFront = state.units.filter((unit) => unit.side === "german" && unit.role === "front");
  const germanRear = state.units.filter((unit) => unit.side === "german" && unit.role !== "front");

  const fatigueAverage = germanFront.length
    ? germanFront.reduce((sum, unit) => sum + unit.fatigue, 0) / germanFront.length
    : 0;

  const frontStrength = germanFront.reduce((sum, unit) => sum + unit.strength, 0);
  const rearStability = germanRear.length
    ? germanRear.reduce((sum, unit) => sum + unit.cohesion, 0) / germanRear.length
    : state.germanCommandCohesion;

  const visibleNodes = state.nodes.map((node) => {
    const localAlliedPowerEstimate = state.units
      .filter((unit) => unit.side === "allied" && unit.nodeId === node.id)
      .reduce((sum, unit) => sum + unit.strength, 0);

    const localGermanPower = state.units
      .filter((unit) => unit.side === "german" && unit.nodeId === node.id)
      .reduce((sum, unit) => sum + unit.strength, 0);

    const routeValueToParis = node.id === "meaux" || node.id === "ourcq_line" || node.id === "marne_crossings"
      ? 90
      : node.id === "paris_rail_hub"
      ? 95
      : 40;

    return {
      nodeId: node.id,
      control: node.control,
      localAlliedPowerEstimate,
      localGermanPower,
      routeValueToParis
    };
  });

  return {
    currentTimeMinutes: state.currentTimeMinutes,
    strategicState: {
      parisThreat: state.parisThreat,
      flankGap: state.flankGap,
      germanOperationalMomentum: state.germanOperationalMomentum,
      alliedOperationalMomentum: state.alliedOperationalMomentum,
      railwayCongestion: state.railwayCongestion,
      intelligenceLevel: state.intelligenceLevel
    },
    germanState: {
      supplyPressure: state.germanSupplyPressure,
      commandCohesion: state.germanCommandCohesion,
      fatigueAverage,
      frontStrength,
      rearStability
    },
    visibleNodes,
    availableUnitIds: germanFront.map((unit) => unit.id),
    activeOrders: orderContext.activeOrders,
    recentOrders: orderContext.recentOrders,
    recentEvents: recentEvents.slice(-12)
  };
}
