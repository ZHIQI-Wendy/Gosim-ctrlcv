import { NextRequest, NextResponse } from "next/server";
import { environmentalAdjudicatorMock } from "@/lib/ai/environmentalAdjudicatorMock";
import { EnvironmentalAdjudicatorInput } from "@/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const input = body?.input as EnvironmentalAdjudicatorInput;
  if (!input) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }

  const output = environmentalAdjudicatorMock(input);
  return NextResponse.json({ output });
}
