let cachedModel: string | null = null;

async function readJsonSafe(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function listModels(): Promise<string[]> {
  const response = await fetch("/api/ai/models", {
    method: "GET"
  });

  if (!response.ok) return [];
  const payload = await readJsonSafe(response);
  const models = Array.isArray(payload?.models)
    ? payload.models.filter((id: any) => typeof id === "string")
    : [];

  return models;
}

async function selectModel(): Promise<string> {
  if (cachedModel) return cachedModel;

  const models = await listModels().catch(() => []);
  const glmModel = models.find((id) => id.toLowerCase().includes("glm"));

  cachedModel = glmModel ?? "glm-5.1";
  return cachedModel;
}

function parseJsonContent(content: string): unknown {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Empty AI response content");
  return JSON.parse(trimmed);
}

export async function requestTaskJson<T>(taskPrompt: string, input: unknown): Promise<T> {
  const model = await selectModel();
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      taskPrompt,
      input
    })
  });

  const payload = await readJsonSafe(response);

  if (!response.ok) {
    const reason = payload?.error ?? `HTTP ${response.status}`;
    throw new Error(`AI request failed: ${reason}`);
  }

  const content = payload?.content;
  if (typeof content !== "string") {
    throw new Error("AI response missing JSON content");
  }

  return parseJsonContent(content) as T;
}
