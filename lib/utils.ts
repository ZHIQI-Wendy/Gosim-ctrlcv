import { END_TIME, START_TIME, TOTAL_GAME_HOURS } from "@/data/initialState";

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const startTimeMs = Date.parse(START_TIME + "Z");
const endTimeMs = Date.parse(END_TIME + "Z");

export function currentTimeToDate(currentTimeMinutes: number): Date {
  return new Date(startTimeMs + currentTimeMinutes * 60_000);
}

export function formatCampaignTime(currentTimeMinutes: number): string {
  const at = currentTimeToDate(currentTimeMinutes);
  const month = at.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const day = String(at.getUTCDate()).padStart(2, "0");
  const hh = String(at.getUTCHours()).padStart(2, "0");
  const mm = String(at.getUTCMinutes()).padStart(2, "0");
  return `${month} ${day} ${hh}:${mm}`;
}

export function getTimeLeftMinutes(currentTimeMinutes: number): number {
  return Math.max(0, TOTAL_GAME_HOURS * 60 - currentTimeMinutes);
}

export function getElapsedRatio(currentTimeMinutes: number): number {
  return clamp(currentTimeMinutes / (TOTAL_GAME_HOURS * 60), 0, 1);
}

export function formatClockByMinutes(currentTimeMinutes: number): string {
  const at = currentTimeToDate(currentTimeMinutes);
  const hh = String(at.getUTCHours()).padStart(2, "0");
  const mm = String(at.getUTCMinutes()).padStart(2, "0");
  const day = at.getUTCDate();
  const year = at.getUTCFullYear();
  return `${hh}:${mm} ${day} Sept. ${year}`;
}

export function formatTimeLeftLabel(currentTimeMinutes: number): string {
  const left = getTimeLeftMinutes(currentTimeMinutes);
  const hours = Math.floor(left / 60);
  const minutes = left % 60;
  return `${String(hours).padStart(2, "0")}h${String(minutes).padStart(2, "0")}m`;
}

export function hasReachedEndTime(currentTimeMinutes: number): boolean {
  const nowMs = startTimeMs + currentTimeMinutes * 60_000;
  return nowMs >= endTimeMs;
}
