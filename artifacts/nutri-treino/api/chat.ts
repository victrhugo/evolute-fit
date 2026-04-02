const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const FREE_MODELS = [
  "qwen/qwen3.6-plus:free",
  "openai/gpt-oss-120b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "arcee-ai/trinity-mini:free",
];

export const config = {
  maxDuration: 30,
};

async function callOpenRouter(
  apiKey: string,
  chatMessages: { role: string; content: string }[],
): Promise<Response> {
  for (let attempt = 0; attempt < FREE_MODELS.length; attempt++) {
    const model = FREE_MODELS[attempt];
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://elevate-app.vercel.app",
        "X-Title": "Elevate Coach",
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        stream: true,
        max_tokens: 1024,
      }),
    });

    if (response.ok) {
      return response;
    }
  }

  throw new Error("All models failed. Please try again.");
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { messages, systemPrompt } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "AI service not configured" });
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

  let openRouterResponse: Response;
  try {
    openRouterResponse = await callOpenRouter(apiKey, chatMessages);
  } catch {
    res.status(503).json({
      error:
        "Coach temporariamente sobrecarregado. Aguarde alguns segundos e tente novamente.",
    });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const reader = openRouterResponse.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    res.write(`data: ${JSON.stringify({ error: "Sem resposta da IA." })}\n\n`);
    res.end();
    return;
  }

  let buffer = "";

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

      try {
        const parsed = JSON.parse(raw);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
}
