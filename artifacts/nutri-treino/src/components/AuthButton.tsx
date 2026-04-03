import { useState } from "react";
import { LogIn, LogOut, Mail, Check, Loader2, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type LoginState = "idle" | "input" | "sent" | "loading";

export default function AuthButton() {
  const { user, isLoading, signIn, signOut } = useAuth();
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleSendLink() {
    if (!email.trim() || !email.includes("@")) {
      setError("Digite um email válido.");
      return;
    }
    setError("");
    setLoginState("loading");
    try {
      await signIn(email.trim());
      setLoginState("sent");
    } catch {
      setError("Erro ao enviar. Tente novamente.");
      setLoginState("input");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSendLink();
    if (e.key === "Escape") {
      setLoginState("idle");
      setEmail("");
      setError("");
    }
  }

  if (isLoading) return null;

  if (user) {
    const displayEmail =
      user.email && user.email.length > 20
        ? user.email.slice(0, 18) + "…"
        : user.email;

    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-1.5">
          <User className="w-3 h-3 shrink-0" />
          <span className="font-medium">{displayEmail}</span>
        </div>
        <button
          onClick={signOut}
          title="Sair"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 rounded-lg px-3 py-1.5 transition-colors duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    );
  }

  if (loginState === "sent") {
    return (
      <div className="flex items-center gap-2 text-xs text-primary font-medium bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5">
        <Check className="w-3.5 h-3.5 shrink-0" />
        <span>Verifique seu email</span>
      </div>
    );
  }

  if (loginState === "input" || loginState === "loading") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2 py-1 focus-within:border-primary/50 transition-colors">
          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="seu@email.com"
            disabled={loginState === "loading"}
            className="w-40 sm:w-52 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleSendLink}
          disabled={loginState === "loading"}
          className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg disabled:opacity-50 transition-opacity"
        >
          {loginState === "loading" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Enviar link"
          )}
        </button>
        <button
          onClick={() => {
            setLoginState("idle");
            setEmail("");
            setError("");
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
        {error && (
          <span className="text-xs text-destructive absolute mt-8">{error}</span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setLoginState("input")}
      className="flex items-center gap-1.5 text-sm font-semibold text-foreground border border-border hover:border-primary/40 hover:text-primary px-4 py-2 rounded-lg transition-colors duration-200"
    >
      <LogIn className="w-3.5 h-3.5" />
      Entrar
    </button>
  );
}
