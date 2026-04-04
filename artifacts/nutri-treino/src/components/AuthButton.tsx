import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

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
  const { user, isLoading, signInWithGoogle, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar com Google.";
      setError(msg);
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="w-28 h-8 rounded-lg bg-muted/40 animate-pulse" />
    );
  }

  if (user) {
    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    const name = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email) as string;
    const displayName = name.length > 22 ? name.slice(0, 20) + "…" : name;

    return (
      <div className="flex items-center gap-2">
        {/* User pill */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-lg px-2.5 py-1.5">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium hidden sm:block">{displayName}</span>
        </div>

        {/* Logout button */}
        <button
          onClick={signOut}
          title="Sair"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 rounded-lg px-3 py-1.5 transition-colors duration-200"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors duration-200 shadow-sm disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        ) : (
          <GoogleIcon />
        )}
        <span>{loading ? "Entrando…" : "Entrar com Google"}</span>
      </button>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
