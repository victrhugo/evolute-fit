import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Lock, Zap, Loader2, Crown, Copy, Check, X, ArrowRight, Rocket } from "lucide-react";
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

interface PayerInfo {
  firstName: string;
  lastName: string;
  cpf: string;
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function isValidCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10 || check === 11) check = 0;
  if (check !== Number(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10 || check === 11) check = 0;
  return check === Number(digits[10]);
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
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 10 }}>
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
  const [showModal, setShowModal] = useState(false);

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
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 px-6 rounded-xl btn-glow transition-opacity"
        >
          <Zap className="w-4 h-4" fill="currentColor" />
          Pagar R$14,90 com PIX
        </button>
      </div>

      {showModal && (
        <PaymentModal user={user} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function PaymentModal({
  user,
  onClose,
}: {
  user: { email?: string | null; id?: string } | null;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"form" | "pix">("form");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [payer, setPayer] = useState<PayerInfo>({
    firstName: "",
    lastName: "",
    cpf: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Lock body scroll when modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function handleGeneratePix() {
    setError("");
    if (!payer.firstName.trim()) {
      setError("Informe seu nome.");
      return;
    }
    if (!isValidCpf(payer.cpf)) {
      setError("CPF inválido. Verifique e tente novamente.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email ?? "",
          userId: user?.id ?? "",
          firstName: payer.firstName.trim(),
          lastName: payer.lastName.trim(),
          cpf: payer.cpf,
        }),
      });
      const data = (await res.json()) as PaymentData & { error?: string };
      if (data.error) {
        setError(data.error);
        return;
      }
      setPaymentData(data);
      setStep("pix");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div
      style={{ zIndex: 9999 }}
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "form" ? (
          <>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
                <Zap className="w-3 h-3" fill="currentColor" />
                Evolute Premium
              </div>
              <h3 className="font-black text-lg tracking-tight">
                Dados para o PIX
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                Necessário para gerar o pagamento.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground font-medium block mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    placeholder="João"
                    value={payer.firstName}
                    onChange={(e) =>
                      setPayer((p) => ({ ...p, firstName: e.target.value }))
                    }
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground font-medium block mb-1">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    placeholder="Silva"
                    value={payer.lastName}
                    onChange={(e) =>
                      setPayer((p) => ({ ...p, lastName: e.target.value }))
                    }
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={payer.cpf}
                  onChange={(e) =>
                    setPayer((p) => ({ ...p, cpf: formatCpf(e.target.value) }))
                  }
                  inputMode="numeric"
                  maxLength={14}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs text-center">{error}</p>
              )}
            </div>

            <button
              onClick={handleGeneratePix}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 px-6 rounded-xl btn-glow disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {loading ? "Gerando PIX..." : "Gerar QR Code PIX"}
            </button>
          </>
        ) : (
          paymentData && (
            <PixDisplay
              paymentData={paymentData}
              userId={user?.id ?? ""}
              userEmail={user?.email ?? ""}
              onClose={onClose}
            />
          )
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function PixDisplay({
  paymentData,
  userId,
  userEmail,
  onClose,
}: {
  paymentData: PaymentData;
  userId: string;
  userEmail: string;
  onClose: () => void;
}) {
  const { refreshPremium } = useAuth();
  const [copied, setCopied] = useState(false);
  const [pollState, setPollState] = useState<"waiting" | "checking" | "approved">("waiting");
  const isApproved = useRef(false);

  // Mark approved and refresh auth state
  const handleApproved = useCallback(async () => {
    if (isApproved.current) return;
    isApproved.current = true;
    setPollState("approved");
    await refreshPremium();
  }, [refreshPremium]);

  // Poll 1: MP API (also updates DB as fallback if approved)
  const checkMpStatus = useCallback(async () => {
    if (isApproved.current) return;
    try {
      const res = await fetch(`/api/payment-status/${paymentData.payment_id}`);
      const data = (await res.json()) as { status?: string };
      if (data.status === "approved") await handleApproved();
    } catch {
      // silent — will retry
    }
  }, [paymentData.payment_id, handleApproved]);

  // Poll 2: DB directly (catches webhook activations immediately)
  const checkDbPremium = useCallback(async () => {
    if (isApproved.current || !userEmail) return;
    try {
      const res = await fetch(
        `/api/check-premium?email=${encodeURIComponent(userEmail)}`
      );
      const data = (await res.json()) as { is_premium?: boolean };
      if (data.is_premium) await handleApproved();
    } catch {
      // silent — will retry
    }
  }, [userEmail, handleApproved]);

  useEffect(() => {
    // Run immediately on mount
    void checkMpStatus();
    void checkDbPremium();

    // MP poll every 5s, DB poll every 3s
    const mpPoll = setInterval(checkMpStatus, 5000);
    const dbPoll = setInterval(checkDbPremium, 3000);

    // Visual pulse between "waiting" / "checking"
    const pulse = setInterval(() => {
      if (!isApproved.current) {
        setPollState((s) => (s === "approved" ? "approved" : s === "waiting" ? "checking" : "waiting"));
      }
    }, 3000);

    return () => {
      clearInterval(mpPoll);
      clearInterval(dbPoll);
      clearInterval(pulse);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(paymentData.pix_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("Não foi possível copiar. Copie o código manualmente.");
    }
  }

  if (pollState === "approved") {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="relative">
          <div className="absolute -inset-3 bg-green-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
            <Rocket className="w-9 h-9 text-green-400" />
          </div>
        </div>
        <div>
          <h3 className="font-black text-2xl tracking-tight text-green-400">
            Acesso liberado!
          </h3>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            Bem-vindo ao Evolute Premium.<br />Seu plano completo já está disponível.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground font-bold py-3 px-6 rounded-xl btn-glow"
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
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

      <div className="bg-white rounded-xl p-2 mx-auto">
        <img
          src={`data:image/png;base64,${paymentData.qr_code_base64}`}
          alt="QR Code PIX"
          className="w-48 h-48"
        />
      </div>

      <div className="space-y-2">
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
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap hover:opacity-90 transition-opacity"
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

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span>
          {pollState === "checking"
            ? "Verificando pagamento..."
            : "Aguardando pagamento..."}
        </span>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        O acesso é liberado automaticamente após o pagamento.
      </p>
    </>
  );
}

export function PremiumCoachButton({ onClick }: { onClick: () => void }) {
  const { isPremium, user } = useAuth();
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

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 border border-border bg-card/90 backdrop-blur-sm text-foreground font-semibold px-5 py-3 rounded-2xl shadow-lg hover:border-primary/40 transition-colors"
      >
        <Crown className="w-4 h-4 text-primary" />
        Desbloquear Coach
      </button>

      {showModal && (
        <PaymentModal user={user} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
