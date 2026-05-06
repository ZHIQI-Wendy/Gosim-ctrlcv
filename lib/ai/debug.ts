export function isAiDebugEnabled(): boolean {
  const value = process.env.AI_DEBUG ?? process.env.R9S_DEBUG ?? "";
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function logAiDebugLines(scope: string, lines: Array<string | undefined | null>): void {
  if (!isAiDebugEnabled()) return;

  for (const line of lines) {
    if (typeof line !== "string") continue;
    console.log(`[AI_DEBUG][${scope}] ${line}`);
  }
}
