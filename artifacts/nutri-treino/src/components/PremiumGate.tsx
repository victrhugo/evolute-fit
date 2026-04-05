import { useState } from "react";
import { Lock, Zap, Crown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { CheckoutModal } from "@/components/CheckoutModal";

interface PremiumGateProps {
  children: React.ReactNode;
  /** How many children to show before the lock. */
  freeCount?: number;
  label?: string;
}

export function PremiumGate({ children, freeCount = 0, label = "treinos" }: PremiumGateProps) {
  const { isPremium } = useAuth();

  if (isPremium) return <>{children}</>;

  const arr = Array.isArray(children) ? children : [children];
  const free = arr.slice(0, freeCount);
  const locked = arr.slice(freeCount);

  return (
    <>
      {free}
      {locked.length > 0 && (
        <div className="relative">
          <div className="opacity-25 blur-[3px] pointer-events-none select-none">
            {locked}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <PremiumCTA label={label} />
          </div>
        </div>
      )}
    </>
  );
}

export function PremiumCTA({ label = "funcionalidades premium" }: { label?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-card/95 border border-primary/30 backdrop-blur-md rounded-2xl px-8 py-8 flex flex-col items-center gap-4 shadow-xl max-w-sm w-full mx-auto text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-black text-lg tracking-tight mb-1">
            Conteúdo Premium
          </h3>
          <p className="text-muted-foreground text-sm">
            Desbloqueie {label} e o Coach IA por apenas{" "}
            <strong className="text-foreground">R$14,90</strong> — pagamento único.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 px-6 rounded-xl btn-glow transition-opacity"
        >
          <Zap className="w-4 h-4" fill="currentColor" />
          Desbloquear Premium · R$14,90
        </button>
      </div>

      {open && (
        <CheckoutModal
          email={user?.email ?? ""}
          userId={user?.id ?? ""}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function PremiumCoachButton({ onClick }: { onClick: () => void }) {
  const { isPremium, user } = useAuth();
  const [open, setOpen] = useState(false);

  if (isPremium) {
    return (
      <button
        onClick={onClick}
        className="fixed bottom-6 right-6 z-40 btn-glow flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-2xl shadow-lg"
      >
        <Zap className="w-4 h-4" fill="currentColor" />
        Coach IA
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 border border-border bg-card/90 backdrop-blur-sm text-foreground font-semibold px-5 py-3 rounded-2xl shadow-lg hover:border-primary/40 transition-colors"
      >
        <Crown className="w-4 h-4 text-primary" />
        Desbloquear Coach
      </button>

      {open && (
        <CheckoutModal
          email={user?.email ?? ""}
          userId={user?.id ?? ""}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
