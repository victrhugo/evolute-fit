import { useState, useRef, useEffect } from "react";
import { Zap, Send, X, Loader2, MessageCircle, ChevronDown } from "lucide-react";
import { GeneratedPlan } from "@/lib/planGenerator";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CoachProps {
  plan: GeneratedPlan;
  onClose: () => void;
}

function buildSystemPrompt(plan: GeneratedPlan): string {
  const { userData, nutrition, workout, strategy, tips } = plan;
  return `Você é o Coach IA do app Elevate — um especialista em nutrição esportiva e treinamento físico.

DADOS DO USUÁRIO:
- Idade: ${userData.age} anos
- Sexo: ${userData.gender}
- Peso: ${userData.weight}kg | Altura: ${userData.height}cm
- Objetivo: ${userData.goal}
- Nível: ${userData.level}
- Frequência de treino: ${userData.frequency}/semana
- Tempo por sessão: ${userData.duration}
- Restrições: ${userData.restrictions || "Nenhuma"}
- Preferências: ${userData.preferences || "Nenhuma"}

PLANO ATUAL:
- TDEE estimado: ${nutrition.tdee} kcal/dia
- Meta calórica: ${nutrition.targetCalories} kcal/dia
- Macros: ${nutrition.macros.protein}g proteína | ${nutrition.macros.carbs}g carboidratos | ${nutrition.macros.fat}g gordura

REFEIÇÕES:
${nutrition.meals.map(m => `• ${m.name}: ${m.calories}kcal | ${m.protein}g P | ${m.carbs}g C | ${m.fat}g G\n  Alimentos: ${m.items.join(", ")}`).join("\n")}

TREINO SEMANAL:
${workout.map(d => `• ${d.day} — ${d.focus}: ${d.exercises.map(e => e.name).join(", ")}`).join("\n")}

ESTRATÉGIA: ${strategy}

DICAS DO PLANO: ${tips.join(" | ")}

REGRAS PARA SUAS RESPOSTAS:
- Responda SEMPRE em português brasileiro
- Seja direto, claro e objetivo — sem enrolação
- Base suas respostas no plano atual do usuário
- Sugira substituições alimentares simples e acessíveis
- Adapte treinos de forma segura e progressiva
- NUNCA recomende medicamentos, hormônios ou suplementos avançados
- Seja motivador mas realista — sem promessas exageradas
- Se a pergunta sair do escopo de nutrição/treino, redirecione gentilmente
- Máximo de 3-4 seções por resposta

FORMATAÇÃO OBRIGATÓRIA DAS RESPOSTAS:
- NUNCA use Markdown. Proibido usar **, *, _, -, #, >, backticks ou qualquer símbolo de formatação
- NUNCA use listas com traços, asteriscos ou marcadores de qualquer tipo
- NUNCA escreva textos longos e contínuos
- Divida SEMPRE a resposta em blocos curtos com títulos em LETRAS MAIÚSCULAS
- Cada bloco deve ter no máximo 2 a 3 linhas e conter apenas uma ideia
- Separe cada bloco com uma linha em branco
- Linguagem simples, direta e profissional
- A última seção deve sempre oferecer personalização ou próximo passo para o usuário

SIGA EXATAMENTE ESTE MODELO DE ESTRUTURA:

TÍTULO PRINCIPAL

Explicação breve com no máximo 2 linhas.
Apenas o essencial, sem enrolação.

SEGUNDO BLOCO

Uma ideia por bloco, no máximo 2 linhas.
Fácil de ler rapidamente.

TERCEIRO BLOCO

Orientação prática e direta.
Sem explicações desnecessárias.

AJUSTE PERSONALIZADO

Ofereça uma pergunta ou próximo passo.
Mostre que a resposta pode ser refinada para o usuário.`;
}

function isAllCaps(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 2) return false;
  return trimmed === trimmed.toUpperCase() && /[A-ZÁÉÍÓÚÀÂÊÔÃÕÇÜ]/.test(trimmed);
}

function formatAssistantMessage(content: string): React.ReactNode {
  const paragraphs = content.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  if (paragraphs.length <= 1) {
    const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) return <span>{content}</span>;

    return (
      <div className="space-y-2.5">
        {lines.map((line, i) =>
          isAllCaps(line) ? (
            <p key={i} className="text-[11px] font-bold tracking-widest text-primary/80 uppercase">
              {line}
            </p>
          ) : (
            <p key={i} className="text-sm leading-relaxed">{line}</p>
          )
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => {
        const lines = para.split("\n").map(l => l.trim()).filter(Boolean);
        const firstLine = lines[0];
        const rest = lines.slice(1).join(" ");

        if (isAllCaps(firstLine)) {
          return (
            <div key={i} className="space-y-1">
              <p className="text-[11px] font-bold tracking-widest text-primary/80 uppercase">
                {firstLine}
              </p>
              {rest && <p className="text-sm leading-relaxed text-foreground/85">{rest}</p>}
            </div>
          );
        }

        return (
          <p key={i} className="text-sm leading-relaxed text-foreground/85">
            {para.replace(/\n/g, " ")}
          </p>
        );
      })}
    </div>
  );
}

export default function Coach({ plan, onClose }: CoachProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Olá! Sou o seu coach do Elevate. Seu plano está pronto — posso te ajudar a tirar dúvidas, sugerir substituições alimentares, ajustar o treino ou qualquer outra coisa relacionada à sua evolução. O que você quer saber?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          systemPrompt: buildSystemPrompt(plan),
        }),
      });

      if (!response.ok) {
        let errorMsg = "Ocorreu um erro. Tente novamente.";
        try {
          const body = await response.json();
          if (body?.error) errorMsg = body.error;
        } catch {}
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last.role === "assistant" && last.content === "") {
            next[next.length - 1] = { ...last, content: errorMsg };
          }
          return next;
        });
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let buffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(raw);
          } catch {
            continue;
          }

          if (parsed.done) {
            streamDone = true;
            break;
          }

          if (parsed.error) {
            throw new Error(String(parsed.error));
          }

          if (parsed.content) {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last.role === "assistant") {
                next[next.length - 1] = {
                  ...last,
                  content: last.content + String(parsed.content),
                };
              }
              return next;
            });
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.role === "assistant" && last.content === "") {
          next[next.length - 1] = {
            ...last,
            content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
          };
        }
        return next;
      });
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        data-testid="coach-backdrop"
      />

      {/* Chat panel */}
      <div
        data-testid="coach-panel"
        className="relative w-full sm:max-w-lg h-[85vh] sm:h-[75vh] flex flex-col bg-[#111111] border border-[#222] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <Zap className="w-4.5 h-4.5 text-primary" fill="currentColor" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-[#111111]" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Seu coach inteligente</p>
              <p className="text-xs text-muted-foreground leading-tight">Tire dúvidas e ajuste seu plano em tempo real</p>
            </div>
          </div>
          <button
            data-testid="button-close-coach"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors duration-200 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
          {messages.map((msg, i) => (
            <div
              key={i}
              data-testid={`message-${msg.role}-${i}`}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-primary" fill="currentColor" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-[#1c1c1c] border border-[#2a2a2a] text-foreground/90 rounded-tl-sm"
                }`}
              >
                {msg.content === "" && isStreaming ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                    <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                  </span>
                ) : msg.role === "assistant" ? (
                  formatAssistantMessage(msg.content)
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-[#222] shrink-0">
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 focus-within:border-primary/40 transition-colors duration-200">
            <input
              ref={inputRef}
              data-testid="input-coach-message"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo sobre seu plano..."
              disabled={isStreaming}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none disabled:opacity-50"
            />
            <button
              data-testid="button-send-message"
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-90 shrink-0"
            >
              {isStreaming ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
            As respostas do coach são sugestões e não substituem profissionais de saúde.
          </p>
        </div>
      </div>
    </div>
  );
}

export function CoachButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      data-testid="button-open-coach"
      onClick={onClick}
      className="btn-glow fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-primary text-primary-foreground font-bold text-sm px-5 py-3.5 rounded-2xl shadow-xl"
    >
      <MessageCircle className="w-4.5 h-4.5" />
      Falar com seu coach
    </button>
  );
}
