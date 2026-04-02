import type { IncomingMessage, ServerResponse } from "http";

export const config = {
  maxDuration: 30,
};

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface ModelConfig {
  id: string;
  disableThinking?: boolean;
}

const FREE_MODELS: ModelConfig[] = [
  { id: "stepfun/step-3.5-flash:free" },
  { id: "arcee-ai/trinity-mini:free" },
  { id: "qwen/qwen3.6-plus:free", disableThinking: true },
];

async function callOpenRouter(
  apiKey: string,
  chatMessages: { role: string; content: string }[],
  modelConfig: ModelConfig,
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: modelConfig.id,
    messages: chatMessages,
    stream: true,
    max_tokens: 1200,
  };

  if (modelConfig.disableThinking) {
    body["enable_thinking"] = false;
  }

  return fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "https://elevate-app.vercel.app",
      "X-Title": "Elevate Coach",
    },
    body: JSON.stringify(body),
  });
}

async function tryModels(
  apiKey: string,
  chatMessages: { role: string; content: string }[],
): Promise<Response> {
  let lastStatus = 0;
  let lastError = "";

  for (const modelConfig of FREE_MODELS) {
    const response = await callOpenRouter(apiKey, chatMessages, modelConfig);
    if (response.ok) return response;
    lastStatus = response.status;
    lastError = await response.text().catch(() => "unknown error");
  }

  throw new Error(`All models failed. Last status: ${lastStatus}. ${lastError}`);
}

function stripThinkingContent(chunk: string, inThinkBlock: { value: boolean }): string {
  let output = "";
  let i = 0;

  while (i < chunk.length) {
    if (!inThinkBlock.value) {
      const start = chunk.indexOf("<think>", i);
      if (start === -1) {
        output += chunk.slice(i);
        break;
      }
      output += chunk.slice(i, start);
      inThinkBlock.value = true;
      i = start + 7;
    } else {
      const end = chunk.indexOf("</think>", i);
      if (end === -1) {
        break;
      }
      inThinkBlock.value = false;
      i = end + 8;
    }
  }

  return output;
}

type VercelRequest = IncomingMessage & { body: unknown };

export default async function handler(req: VercelRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const body = req.body as {
    messages?: { role: "user" | "assistant"; content: string }[];
    systemPrompt?: string;
  };

  const { messages, systemPrompt } = body ?? {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "messages array is required" }));
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "AI service not configured" }));
    return;
  }

  const chatMessages = [
    {
      role: "system",
      content:
        systemPrompt ||
        "Você é um coach de fitness e nutrição especializado. Responda em português brasileiro.",
    },
    ...messages,
  ];

  let response: Response;
  try {
    response = await tryModels(apiKey, chatMessages);
  } catch {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Coach temporariamente sobrecarregado. Aguarde alguns segundos e tente novamente.",
      }),
    );
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    res.write(`data: ${JSON.stringify({ error: "Sem resposta da IA." })}\n\n`);
    res.end();
    return;
  }

  let buffer = "";
  const inThinkBlock = { value: false };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]" || !raw) continue;

        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(raw);
        } catch {
          continue;
        }

        const choices = parsed.choices as
          | Array<{ delta?: { content?: string; reasoning?: unknown } }>
          | undefined;

        if (choices?.[0]?.delta?.reasoning) continue;

        const rawContent: string | undefined = choices?.[0]?.delta?.content;
        if (!rawContent) continue;

        const content = stripThinkingContent(rawContent, inThinkBlock);
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    }
  } catch {
    res.write(`data: ${JSON.stringify({ error: "Erro inesperado. Tente novamente." })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
}
