import { ApiError, getApiBaseUrl, handleUnauthorized } from "../client";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export type RagAnswerResult = {
  answer: string;
  hit: boolean;
  meta?: unknown;
};

export type RagAnswerStreamHandlers = {
  onDelta: (delta: string) => void;
  onMeta?: (payload: { hit: boolean; meta: unknown }) => void;
};

export async function answerQuestion(
  question: string,
  handlers: RagAnswerStreamHandlers,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const q = question.trim();
  if (!q) throw new Error("question is required");

  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/rag/answer`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
    },
    body: JSON.stringify({ question: q }),
    signal: options?.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401) {
      void handleUnauthorized();
    }
    throw new ApiError(text || `HTTP ${res.status}`, res.status, text);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("stream not supported");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, "\n");

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      const lines = rawEvent
        .split("\n")
        .map((l) => l.trimEnd())
        .filter(Boolean);

      let eventName = "message";
      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice("event:".length).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice("data:".length).trimStart());
        }
      }

      if (dataLines.length === 0) continue;
      const dataStr = dataLines.join("\n").trim();
      if (!dataStr) continue;

      let payload: unknown = dataStr;
      try {
        payload = JSON.parse(dataStr);
      } catch {
        // keep string
      }

      if (eventName === "delta") {
        const delta =
          typeof payload === "string"
            ? payload
            : isRecord(payload)
              ? String(payload.delta ?? "")
              : "";
        if (delta) handlers.onDelta(delta);
        continue;
      }

      if (eventName === "meta") {
        if (isRecord(payload)) {
          handlers.onMeta?.({ hit: Boolean(payload.hit), meta: payload.meta });
        }
        continue;
      }

      if (eventName === "error") {
        const message =
          typeof payload === "string"
            ? payload
            : isRecord(payload)
              ? String(payload.message ?? "stream error")
              : "stream error";
        throw new Error(message);
      }

      if (eventName === "done") {
        return;
      }
    }
  }
}
