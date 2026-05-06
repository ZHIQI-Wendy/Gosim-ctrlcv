import { NextRequest, NextResponse } from "next/server";
import { getDemoGermanDecision } from "@/lib/demo/demoDirector";
import { germanCommanderMock } from "@/lib/ai/germanCommanderMock";
import { GermanAgentInput } from "@/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const input = body?.input as GermanAgentInput;
  if (!input) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }

  const output = getDemoGermanDecision(input) ?? germanCommanderMock(input);
  return NextResponse.json({ output });
}
