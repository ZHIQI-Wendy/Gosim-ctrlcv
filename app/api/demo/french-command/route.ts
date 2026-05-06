import { NextRequest, NextResponse } from "next/server";
import { getDemoFrenchDecision } from "@/lib/demo/demoDirector";
import { frenchCommandParserMock } from "@/lib/ai/frenchCommandParserMock";
import { FrenchCommandParserInput } from "@/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const input = body?.input as FrenchCommandParserInput;
  if (!input) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }

  const output = getDemoFrenchDecision(input) ?? frenchCommandParserMock(input);
  return NextResponse.json({ output });
}
