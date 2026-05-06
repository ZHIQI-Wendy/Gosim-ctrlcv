import { AIOrderContext, GameState } from "@/types";

function toOrderContext(state: GameState): AIOrderContext[] {
  return state.orderQueue.map((order) => ({
    action: order.action,
    targetNodeId: order.targetNodeId,
    unitId: order.unitId,
    status: order.status,
    createdAtMinutes: order.createdAtMinutes,
    delayMinutes: order.delayMinutes,
    durationMinutes: order.durationMinutes
  }));
}

export function buildOrderContext(state: GameState): {
  activeOrders: AIOrderContext[];
  recentOrders: AIOrderContext[];
} {
  const all = toOrderContext(state);
  return {
    activeOrders: all.filter((order) => order.status === "active" || order.status === "queued").slice(-8),
    recentOrders: all.slice(-12)
  };
}
