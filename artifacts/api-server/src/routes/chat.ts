import { Router, type IRouter } from "express";

const router: IRouter = Router();

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = "google/gemini-2.0-flash-exp:free";

router.post("/chat", async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
      systemPrompt: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      req.log.error("OPENROUTER_API_KEY not set");
      res.status(500).json({ error: "AI service not configured" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const chatMessages = [
      {
        role: "system",
        content:
          systemPrompt ||
          "Você é um coach de fitness e nutrição especializado. Responda em português brasileiro.",
      },
      ...messages,
    ];

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://elevate-app.vercel.app",
        "X-Title": "Elevate Coach",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: chatMessages,
        stream: true,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      req.log.error({ status: response.status, errorText }, "OpenRouter API error");
      res.write(`data: ${JSON.stringify({ error: "Erro ao conectar com a IA. Tente novamente." })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body?.getReader();
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
          // chunk malformado, ignorar
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Chat error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to get AI response" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Erro inesperado. Tente novamente." })}\n\n`);
      res.end();
    }
  }
});

export default router;
