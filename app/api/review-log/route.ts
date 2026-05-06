import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "action-review.log");

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const lines = Array.isArray(body?.lines)
    ? body.lines.filter((line: unknown): line is string => typeof line === "string")
    : [];

  if (lines.length === 0) {
    return NextResponse.json({ ok: false, error: "No log lines provided" }, { status: 400 });
  }

  await mkdir(LOG_DIR, { recursive: true });
  await appendFile(LOG_FILE, `${lines.join("\n")}\n`, "utf8");

  return NextResponse.json({ ok: true, count: lines.length });
}
