import { FRAME_INTERVAL_SECONDS, GAME_MINUTES_PER_REAL_SECOND } from "@/data/initialState";

export type SpeedLevel = "SLOW" | "NORMAL" | "FAST";

const SPEED_MULTIPLIER: Record<SpeedLevel, number> = {
  SLOW: 0.5,
  NORMAL: 1,
  FAST: 2
};

export function frameIntervalMs(): number {
  return FRAME_INTERVAL_SECONDS * 1000;
}

export function gameMinutesFromRealSeconds(realSeconds: number, speedLevel: SpeedLevel): number {
  return realSeconds * GAME_MINUTES_PER_REAL_SECOND * SPEED_MULTIPLIER[speedLevel];
}
