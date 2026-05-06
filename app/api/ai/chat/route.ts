import {appendFile, mkdir} from "node:fs/promises";
import path from "node:path";
import {NextRequest, NextResponse} from "next/server";
import {logAiDebugLines} from "@/lib/ai/debug";
import {HISTORICAL_CONTEXT_PROMPT} from "@/lib/ai/prompts/historicalContextPrompt";
import {META_PROMPT} from "@/lib/ai/prompts/metaPrompt";

const BASE_URL = "https://api.r9s.ai/v1";
let cachedModel: string | null = null;
export const dynamic = "force-dynamic";

async function readJsonSafe(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch {
        return {raw: text};
    }
}

function isValidJsonObjectString(content: string): boolean {
    const parsed = JSON.parse(content);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
}

function looksLikeJsonObjectMembers(content: string): boolean {
    return /"[^"]+"\s*:/.test(content);
}

function wrapAsJsonObject(content: string): string {
    const trimmed = content.trim();
    const needsOpeningBrace = !trimmed.startsWith("{");
    const needsClosingBrace = !trimmed.endsWith("}");
    return `${needsOpeningBrace ? "{" : ""}${trimmed}${needsClosingBrace ? "}" : ""}`;
}

function tryParseNormalizedJsonObject(content: string): string | null {
    const trimmed = content.trim();
    if (!trimmed) return null;

    const candidates: string[] = [trimmed];

    // Common malformed pattern from upstream: object members without the wrapping braces.
    if (trimmed.startsWith("\"") && !trimmed.startsWith("{")) {
        candidates.push(wrapAsJsonObject(trimmed));
    }

    // Broader repair path: if the content looks like object members but lacks the opening brace,
    // wrap it and let JSON.parse decide whether the structure is recoverable.
    if (!trimmed.startsWith("{") && looksLikeJsonObjectMembers(trimmed)) {
        candidates.push(wrapAsJsonObject(trimmed));
    }

    // Strip fenced code blocks if the model wraps JSON in markdown.
    const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fencedMatch?.[1]) {
        candidates.push(fencedMatch[1].trim());
    }

    // Extract the outermost object if the model prepends text before the JSON.
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        candidates.push(trimmed.slice(firstBrace, lastBrace + 1).trim());
    }

    // Another common malformed pattern: prose prefix followed by JSON members and a closing brace.
    // Example: `thinking: ... "action": "ADVANCE", ... }`
    const firstKeyMatch = trimmed.match(/"[^"]+"\s*:/);
    if (firstKeyMatch?.index !== undefined) {
        const possibleMembers = trimmed.slice(firstKeyMatch.index).trim();
        if (!possibleMembers.startsWith("{") && looksLikeJsonObjectMembers(possibleMembers)) {
            candidates.push(wrapAsJsonObject(possibleMembers));
        }
    }

    for (const candidate of candidates) {
        try {
            if (isValidJsonObjectString(candidate)) {
                return candidate;
            }
        } catch {
            // try next normalization strategy
        }
    }

    return null;
}

function extractFirstValidJsonChoice(payload: any): {
    content: string | null;
    invalidChoices: Array<{index: number; content: unknown; reason: string}>;
} {
    const choices = Array.isArray(payload?.choices) ? payload.choices : [];
    const invalidChoices: Array<{index: number; content: unknown; reason: string}> = [];

    for (let index = 0; index < choices.length; index += 1) {
        const content = choices[index]?.message?.content;
        if (typeof content !== "string") {
            invalidChoices.push({
                index,
                content,
                reason: "choice content is not a string"
            });
            continue;
        }

        try {
            const normalizedContent = tryParseNormalizedJsonObject(content);
            if (normalizedContent) {
                return {content: normalizedContent, invalidChoices};
            }
            invalidChoices.push({
                index,
                content,
                reason: "choice content could not be normalized into a JSON object"
            });
        } catch (error) {
            invalidChoices.push({
                index,
                content,
                reason: error instanceof Error ? error.message : "choice JSON parse failed"
            });
        }
    }

    return {content: null, invalidChoices};
}

function nowStamp(): {fileDate: string; timestamp: string} {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const hours = String(now.getUTCHours()).padStart(2, "0");
    const minutes = String(now.getUTCMinutes()).padStart(2, "0");
    const seconds = String(now.getUTCSeconds()).padStart(2, "0");
    return {
        fileDate: `${year}${month}${day}`,
        timestamp: `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
    };
}

function shellQuote(value: string): string {
    return `'${value.replaceAll("'", `'\\''`)}'`;
}

async function appendAiErrorLog(details: {
    model: string;
    taskPrompt: string;
    input: unknown;
    status?: number;
    responsePayload?: unknown;
    reason: string;
}): Promise<void> {
    try {
        const {fileDate, timestamp} = nowStamp();
        const logsDir = path.join(process.cwd(), "logs");
        await mkdir(logsDir, {recursive: true});

        const requestBody = {
            model: details.model,
            messages: [
                {role: "system", content: META_PROMPT},
                {role: "system", content: HISTORICAL_CONTEXT_PROMPT},
                {role: "system", content: details.taskPrompt},
                {role: "user", content: JSON.stringify(details.input ?? {})}
            ],
            n: 2,
            temperature: 0.2,
            response_format: {type: "json_object"}
        };

        const curlCommand =
            `curl -sS -X POST ${shellQuote(`${BASE_URL}/chat/completions`)} ` +
            `-H 'Content-Type: application/json' ` +
            `-H 'Authorization: Bearer $R9S_TOKEN' ` +
            `--data-raw ${shellQuote(JSON.stringify(requestBody))}`;

        const responseText = typeof details.responsePayload === "string"
            ? details.responsePayload
            : JSON.stringify(details.responsePayload ?? {}, null, 2);

        const logEntry = [
            `[${timestamp}] ${details.reason}`,
            details.status === undefined ? undefined : `status: ${details.status}`,
            "curl:",
            curlCommand,
            "response:",
            responseText,
            ""
        ]
            .filter((line): line is string => typeof line === "string")
            .join("\n");

        await appendFile(path.join(logsDir, `ai_${fileDate}.log`), `${logEntry}\n`, "utf8");
    } catch (logError) {
        console.error("Failed to append AI error log.", logError);
    }
}

async function selectModel(token: string): Promise<string> {
    if (cachedModel) return cachedModel;

    const envModel = process.env.R9S_MODEL;
    logAiDebugLines("chat.selectModel", [
        "model selection start",
        `envModel: ${envModel ?? "(unset)"}`,
        `cachedModel: ${cachedModel ?? "(empty)"}`,
        `requestUrl: ${BASE_URL}/models`
    ]);
    try {
        const response = await fetch(`${BASE_URL}/models`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
            cache: "no-store"
        });

        logAiDebugLines("chat.selectModel", [
            "model list response received",
            `status: ${response.status}`,
            `ok: ${String(response.ok)}`
        ]);

        if (response.ok) {
            const payload = await readJsonSafe(response);
            const models = Array.isArray(payload?.data)
                ? payload.data.map((item: any) => item?.id).filter((id: any) => typeof id === "string")
                : [];
            const glmModel = models.find((id: string) => id.toLowerCase().includes("glm"));
            const selected = glmModel ?? envModel ?? "glm-5.1";
            logAiDebugLines("chat.selectModel", [
                `modelCount: ${models.length}`,
                `selectedModel: ${selected}`
            ]);
            cachedModel = selected;
            return selected;
        }
    } catch (error) {
        logAiDebugLines("chat.selectModel", [
            "model selection request failed",
            `error: ${error instanceof Error ? error.message : String(error)}`
        ]);
    }

    const selected = envModel ?? "glm-5.1";
    logAiDebugLines("chat.selectModel", [
        "model selection fallback",
        `selectedModel: ${selected}`
    ]);
    cachedModel = selected;
    return selected;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const token = process.env.R9S_TOKEN;
    if (!token) {
        return NextResponse.json(
            {error: "R9S_TOKEN is not configured on server"},
            {status: 500}
        );
    }

    const body = await request.json().catch(() => ({}));
    const taskPrompt = typeof body?.taskPrompt === "string" ? body.taskPrompt : "";
    const input = body?.input;

    if (!taskPrompt) {
        return NextResponse.json({error: "taskPrompt is required"}, {status: 400});
    }

    const model = await selectModel(token);
    try {
        const requestBody = {
            model,
            messages: [
                {role: "system", content: META_PROMPT},
                {role: "system", content: HISTORICAL_CONTEXT_PROMPT},
                {role: "system", content: taskPrompt},
                {role: "user", content: JSON.stringify(input ?? {})}
            ],
            n: 2,
            temperature: 0.2,
            response_format: {type: "json_object"}
        };

        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        const payload = await readJsonSafe(response);
        if (!response.ok) {
            await appendAiErrorLog({
                model,
                taskPrompt,
                input,
                status: response.status,
                responsePayload: payload,
                reason: "AI request failed"
            });
            return NextResponse.json(
                {error: "AI request failed", status: response.status, payload},
                {status: response.status}
            );
        }

        const extracted = extractFirstValidJsonChoice(payload);
        const content = extracted.content;
        if (typeof content !== "string") {
            await appendAiErrorLog({
                model,
                taskPrompt,
                input,
                status: response.status,
                responsePayload: {
                    payload,
                    invalidChoices: extracted.invalidChoices
                },
                reason: "AI response missing valid JSON object content"
            });
            return NextResponse.json(
                {error: "AI response missing valid JSON object content", payload},
                {status: 502}
            );
        }

        return NextResponse.json({content});
    } catch (error) {
        await appendAiErrorLog({
            model,
            taskPrompt,
            input,
            reason: error instanceof Error ? error.message : "AI request failed"
        });
        return NextResponse.json(
            {error: error instanceof Error ? error.message : "AI request failed"},
            {status: 502}
        );
    }
}
