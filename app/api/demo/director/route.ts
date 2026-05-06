import { NextResponse } from "next/server";
import { getDemoDirectorDecision } from "@/lib/demo/demoDirector";
import { directorMock } from "@/lib/ai/directorMock";
import { DirectorInput } from "@/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const input = body?.input as DirectorInput;

  if (!input) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }

  const output = getDemoDirectorDecision(input) ?? directorMock(input);
  return NextResponse.json(output);
}
