import { Report } from "@/types";
import { makeId } from "@/lib/utils";

export function makeSystemReport(
  createdAtMinutes: number,
  headline: string,
  reportText: string,
  eventType = "system"
): Report {
  return {
    id: makeId("report"),
    createdAtMinutes,
    headline,
    reportText,
    advisorLine: "",
    eventType
  };
}
