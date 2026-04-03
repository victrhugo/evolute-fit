import { useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle2, Zap, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function SuccessPage() {
  const { refreshPremium } = useAuth();

  useEffect(() => {
    // Reload premium status after successful payment
    const timer = setTimeout(() => {
      refreshPremium();
    }, 2000);
    return () => clearTimeout(timer);
  }, [refreshPremium]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 bg-primary/15 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5" fill="currentColor" />
            Evolute Premium
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Pagamento confirmado!
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Seu acesso premium foi liberado. Agora você tem acesso ao plano
            completo e ao Coach IA personalizado.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3 pt-2">
          <Link href="/plano">
            <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 px-6 rounded-xl btn-glow">
              Ver meu plano completo
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/">
            <button className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
              Voltar ao início
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
