import { GameState } from "@/types";

export function aiTick(): never {
  throw new Error(
    "aiTick is deprecated. Use runEngineTick from src/lib/ruleEngine for staged sim/decision/combat/report loops."
  );
}

export type TickResult = {
  nextState: GameState;
};
