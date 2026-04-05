import { useState, useEffect, useCallback } from "react";
import { Lock, Zap, Loader2, Crown, Copy, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface PremiumGateProps {
  children: React.ReactNode;
  freeCount?: number;
  label?: string;
}

interface PaymentData {
  qr_code_base64: string;
  pix_code: string;
  payment_id: string | number;
  status: string;
}

export function PremiumGate({
  children,
  freeCount = 0,
  label = "treinos",
}: PremiumGateProps) {
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

export function PremiumCTA({
  label = "funcionalidades premium",
}: {
  label?: string;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function handlePayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email ?? "",
          userId: user?.id ?? "",
        }),
      });
      const data = (await res.json()) as PaymentData & { error?: string };
      if (data.error) {
        alert(data.error);
        return;
      }
      setPaymentData(data);
      setShowModal(true);
    } catch {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

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
            <strong className="text-foreground">R$14,90</strong> — pagamento
            único via PIX.
          </p>
        </div>
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 px-6 rounded-xl btn-glow disabled:opacity-60 transition-opacity"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" fill="currentColor" />
          )}
          {loading ? "Gerando PIX..." : "Pagar R$14,90 com PIX"}
        </button>
      </div>

      {showModal && paymentData && (
        <PixModal
          paymentData={paymentData}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function PixModal({
  paymentData,
  onClose,
}: {
  paymentData: PaymentData;
  onClose: () => void;
}) {
  const { refreshPremium } = useAuth();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState(paymentData.status);
  const [approved, setApproved] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/payment-status/${paymentData.payment_id}`);
      const data = (await res.json()) as { status: string };
      setStatus(data.status);
      if (data.status === "approved") {
        setApproved(true);
        await refreshPremium();
      }
    } catch {
      // silent — will retry
    }
  }, [paymentData.payment_id, refreshPremium]);

  useEffect(() => {
    if (approved) return;
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, [approved, checkStatus]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(paymentData.pix_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("Não foi possível copiar. Copie o código manualmente.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {approved ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-black text-xl tracking-tight text-green-500">
                Pagamento confirmado!
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                Seu acesso premium foi liberado. Aproveite!
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-primary text-primary-foreground font-bold py-3 px-6 rounded-xl btn-glow"
            >
              Continuar
            </button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
                <Zap className="w-3 h-3" fill="currentColor" />
                Evolute Premium
              </div>
              <h3 className="font-black text-lg tracking-tight">
                Pague R$14,90 via PIX
              </h3>
            </div>

            <div className="bg-white rounded-xl p-2">
              <img
                src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                alt="QR Code PIX"
                className="w-48 h-48"
              />
            </div>

            <div className="w-full space-y-2">
              <p className="text-xs text-muted-foreground text-center font-medium">
                Ou copie o código PIX:
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={paymentData.pix_code}
                  className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground truncate focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap transition-opacity hover:opacity-90"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>
                {status === "pending"
                  ? "Aguardando pagamento..."
                  : `Status: ${status}`}
              </span>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Após o pagamento, o acesso é liberado automaticamente.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function PremiumCoachButton({ onClick }: { onClick: () => void }) {
  const { isPremium, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  async function handlePayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email ?? "",
          userId: user?.id ?? "",
        }),
      });
      const data = (await res.json()) as PaymentData & { error?: string };
      if (data.error) {
        alert(data.error);
        return;
      }
      setPaymentData(data);
      setShowModal(true);
    } catch {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 border border-border bg-card/90 backdrop-blur-sm text-foreground font-semibold px-5 py-3 rounded-2xl shadow-lg hover:border-primary/40 transition-colors disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Crown className="w-4 h-4 text-primary" />
        )}
        {loading ? "..." : "Desbloquear Coach"}
      </button>

      {showModal && paymentData && (
        <PixModal
          paymentData={paymentData}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
