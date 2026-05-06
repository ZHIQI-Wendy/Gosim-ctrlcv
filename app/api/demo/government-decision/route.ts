import { NextRequest, NextResponse } from "next/server";
import { getDemoGovernmentDecision } from "@/lib/demo/demoDirector";
import { governmentDecisionMock } from "@/lib/ai/governmentDecisionMock";
import { GovernmentDecisionInput } from "@/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const input = body?.input as GovernmentDecisionInput;
  if (!input) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }

  const output = getDemoGovernmentDecision(input) ?? governmentDecisionMock(input);
  return NextResponse.json({ output });
}
