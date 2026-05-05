const CAMPAIGN_START_UTC = Date.UTC(1914, 8, 5, 18, 0, 0);

export function formatCampaignTime(timeLeftHours: number): string {
  const elapsedMinutes = Math.max(0, Math.round((48 - timeLeftHours) * 60));
  const at = new Date(CAMPAIGN_START_UTC + elapsedMinutes * 60 * 1000);
  const month = at.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const day = String(at.getUTCDate()).padStart(2, "0");
  const hh = String(at.getUTCHours()).padStart(2, "0");
  const mm = String(at.getUTCMinutes()).padStart(2, "0");
  return `${month} ${day} ${hh}:${mm}`;
}
