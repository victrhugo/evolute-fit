import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { X, Zap, Loader2, Lock } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

// ── Inner form (must be inside <Elements>) ───────────────────────────────────

function PaymentForm({ onClose }: { onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    const returnUrl = `${window.location.origin}/success`;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (error) {
      setErrorMessage(error.message ?? "Erro ao processar pagamento.");
      setLoading(false);
    }
    // On success, Stripe redirects to return_url automatically
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {errorMessage && (
        <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3.5 px-6 rounded-xl btn-glow disabled:opacity-60 transition-opacity text-base"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" fill="currentColor" />
            Pagar R$14,90
          </>
        )}
      </button>
      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3" />
        Pagamento seguro via Stripe
      </p>
    </form>
  );
}

// ── Modal wrapper ────────────────────────────────────────────────────────────

interface CheckoutModalProps {
  email: string;
  userId: string;
  onClose: () => void;
}

export function CheckoutModal({ email, userId, onClose }: CheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, userId }),
    })
      .then((r) => r.json())
      .then((data: { clientSecret?: string; error?: string }) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setFetchError(data.error ?? "Erro ao iniciar pagamento.");
        }
      })
      .catch(() => setFetchError("Erro de conexão. Tente novamente."));
  }, [email, userId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
              <Zap className="w-3.5 h-3.5" fill="currentColor" />
              Evolute Premium
            </div>
            <p className="font-black text-lg tracking-tight text-foreground">
              R$14,90 — pagamento único
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Plano completo + Coach IA personalizado
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {fetchError ? (
            <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-3">
              {fetchError}
            </p>
          ) : !clientSecret ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#22c55e",
                    colorBackground: "#1a1a1a",
                    colorText: "#f0f0f0",
                    colorDanger: "#ef4444",
                    borderRadius: "10px",
                    fontFamily: "inherit",
                  },
                },
              }}
            >
              <PaymentForm onClose={onClose} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
