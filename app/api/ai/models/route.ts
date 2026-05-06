import { NextResponse } from "next/server";
import { logAiDebugLines } from "@/lib/ai/debug";

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

export async function GET(): Promise<NextResponse> {
  const token = process.env.R9S_TOKEN;
  if (!token) {
    logAiDebugLines("models", [
      "request blocked",
      "reason: R9S_TOKEN is not configured on server"
    ]);
    return NextResponse.json({ models: [] });
  }

  logAiDebugLines("models", [
    "request start",
    `method: GET`,
    `url: ${BASE_URL}/models`,
    `authorization: Bearer $R9S_TOKEN`,
    `cache: no-store`
  ]);

  try {
    const response = await fetch(`${BASE_URL}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    logAiDebugLines("models", [
      "response received",
      `status: ${response.status}`,
      `ok: ${String(response.ok)}`
    ]);

    if (!response.ok) {
      return NextResponse.json({ models: [] });
    }

    const payload = await readJsonSafe(response);
    const models = Array.isArray(payload?.data)
      ? payload.data.map((item: any) => item?.id).filter((id: any) => typeof id === "string")
      : [];

    logAiDebugLines("models", [
      `payloadType: ${Array.isArray(payload?.data) ? "model_list" : typeof payload}`,
      `modelCount: ${models.length}`,
      `models: ${models.join(", ") || "(none)"}`
    ]);

    return NextResponse.json({ models });
  } catch (error) {
    logAiDebugLines("models", [
      "request failed",
      `error: ${error instanceof Error ? error.message : String(error)}`
    ]);
    return NextResponse.json({ models: [] });
  }
}
