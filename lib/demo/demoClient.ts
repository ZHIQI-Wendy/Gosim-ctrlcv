async function readJsonSafe(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function requestDemoJson<T>(path: string, input: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ input })
  });

  const payload = await readJsonSafe(response);
  if (!response.ok) {
    const reason = payload?.error ?? `HTTP ${response.status}`;
    throw new Error(`Demo request failed: ${reason}`);
  }

  return payload?.output as T;
}
