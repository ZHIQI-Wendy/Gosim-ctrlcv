import { NextRequest, NextResponse } from "next/server";
import { getDemoReportDecision } from "@/lib/demo/demoDirector";
import { reportGeneratorMock } from "@/lib/ai/reportGeneratorMock";
import { ReportGeneratorInput } from "@/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const input = body?.input as ReportGeneratorInput;
  if (!input) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }

  const output = getDemoReportDecision(input) ?? reportGeneratorMock(input);
  return NextResponse.json({ output });
}
