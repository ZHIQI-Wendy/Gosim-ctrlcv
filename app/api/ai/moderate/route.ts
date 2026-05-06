import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.r9s.ai/v1";
export const dynamic = "force-dynamic";

async function readJsonSafe(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = process.env.R9S_TOKEN;
  if (!token) {
    return NextResponse.json({ allowed: true, fallback: "token_missing" });
  }

  const body = await request.json().catch(() => ({}));
  const input = typeof body?.input === "string" ? body.input : "";

  try {
    const response = await fetch(`${BASE_URL}/moderations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ input })
    });

    if (!response.ok) {
      return NextResponse.json({ allowed: true, fallback: "api_error" });
    }

    const payload = await readJsonSafe(response);
    const flagged = Boolean(payload?.results?.[0]?.flagged);

    return NextResponse.json({ allowed: !flagged });
  } catch {
    return NextResponse.json({ allowed: true, fallback: "api_error" });
  }
}