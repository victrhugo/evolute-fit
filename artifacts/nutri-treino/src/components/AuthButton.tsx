import { useState } from "react";
import { LogIn, LogOut, Mail, Check, Loader2, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type LoginState = "idle" | "input" | "sent" | "loading" | "google-loading";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthButton() {
  const { user, isLoading, signIn, signInWithGoogle, signOut } = useAuth();
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setError("");
    setLoginState("google-loading");
    try {
      await signInWithGoogle();
      // Page will redirect; no state reset needed
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar com Google.";
      setError(msg);
      setLoginState("idle");
    }
  }

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar.";
      setError(msg);
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

  // Idle state: show Google button + email option
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleGoogleLogin}
        disabled={loginState === "google-loading"}
        className="flex items-center gap-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors duration-200 shadow-sm disabled:opacity-60"
      >
        {loginState === "google-loading" ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        ) : (
          <GoogleIcon />
        )}
        <span className="hidden sm:inline">
          {loginState === "google-loading" ? "Entrando…" : "Entrar com Google"}
        </span>
      </button>
      <button
        onClick={() => setLoginState("input")}
        title="Entrar com email"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 px-3 py-1.5 rounded-lg transition-colors duration-200"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Email</span>
      </button>
    </div>
  );
}
