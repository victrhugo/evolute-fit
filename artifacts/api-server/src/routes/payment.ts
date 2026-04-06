import { Router } from "express";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const router = Router();

function getMercadoPago() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
  return new MercadoPagoConfig({ accessToken });
}

function getSupabase(): SupabaseClient {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!key) throw new Error("Supabase key not configured");
  return createClient(process.env.SUPABASE_URL!, key);
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

async function activatePremium(
  supabase: SupabaseClient,
  opts: { userId?: string | null; email?: string | null; paymentId: string }
): Promise<{ success: boolean; method: string }> {
  const { userId, email, paymentId } = opts;
  const normalizedEmail = normalizeEmail(email);

  // 1. Try by userId first (most reliable)
  if (userId) {
    const { error, count } = await supabase
      .from("users")
      .update({ is_premium: true })
      .eq("id", userId)
      .select("id", { count: "exact", head: true });

    if (!error && (count ?? 0) > 0) {
      console.log(`[payment] premium activated by userId=${userId}`);
      await supabase
        .from("payments")
        .update({ status: "approved" })
        .eq("payment_id", paymentId);
      return { success: true, method: "userId" };
    }
    if (error) console.error(`[payment] update by userId error:`, error.message);
    else console.warn(`[payment] userId=${userId} not found in users table`);
  }

  // 2. Fall back to email match
  if (normalizedEmail) {
    const { error, count } = await supabase
      .from("users")
      .update({ is_premium: true })
      .eq("email", normalizedEmail)
      .select("id", { count: "exact", head: true });

    if (!error && (count ?? 0) > 0) {
      console.log(`[payment] premium activated by email=${normalizedEmail}`);
      await supabase
        .from("payments")
        .update({ status: "approved" })
        .eq("payment_id", paymentId);
      return { success: true, method: "email" };
    }
    if (error) console.error(`[payment] update by email error:`, error.message);
    else console.warn(`[payment] email=${normalizedEmail} not found in users table`);
  }

  console.error(`[payment] could not find user to activate — userId=${userId}, email=${normalizedEmail}`);
  return { success: false, method: "none" };
}

// POST /api/create-payment
router.post("/create-payment", async (req, res) => {
  try {
    const { email, userId, firstName, lastName, cpf } = req.body as {
      email?: string;
      userId?: string;
      firstName?: string;
      lastName?: string;
      cpf?: string;
    };

    if (!email || !userId) {
      res.status(400).json({ error: "email e userId são obrigatórios" });
      return;
    }
    if (!cpf) {
      res.status(400).json({ error: "CPF é obrigatório para pagamento PIX" });
      return;
    }

    console.log(`[payment] creating PIX payment for userId=${userId} email=${email}`);

    const client = getMercadoPago();
    const paymentClient = new Payment(client);

    const result = await paymentClient.create({
      body: {
        transaction_amount: 14.9,
        description: "Evolute Premium",
        payment_method_id: "pix",
        payer: {
          email: normalizeEmail(email)!,
          first_name: firstName || "Cliente",
          last_name: lastName || "Evolute",
          identification: {
            type: "CPF",
            number: cpf.replace(/\D/g, ""),
          },
        },
        external_reference: userId,
      },
      requestOptions: { idempotencyKey: `${userId}-${Date.now()}` },
    });

    const txData = result.point_of_interaction?.transaction_data;

    if (!txData?.qr_code_base64 || !txData?.qr_code) {
      console.error(`[payment] no QR code in MP response`, result);
      res.status(500).json({ error: "Falha ao gerar QR code PIX" });
      return;
    }

    console.log(`[payment] PIX created — payment_id=${result.id} status=${result.status}`);

    try {
      const supabase = getSupabase();
      await supabase.from("payments").insert({
        user_id: userId,
        payment_id: String(result.id),
        status: result.status ?? "pending",
      });
    } catch (dbErr) {
      console.error("[payment] failed to save payment record:", dbErr);
    }

    res.json({
      qr_code_base64: txData.qr_code_base64,
      pix_code: txData.qr_code,
      payment_id: result.id,
      status: result.status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    const cause = (err as Record<string, unknown>)?.cause;
    console.error("[payment] create-payment error:", JSON.stringify({ message, cause }, null, 2));
    res.status(500).json({ error: message, details: cause });
  }
});

// GET /api/payment-status/:id  — polls MP and updates DB as fallback
router.get("/payment-status/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`[payment] polling status for payment_id=${id}`);

  try {
    const client = getMercadoPago();
    const paymentClient = new Payment(client);
    const result = await paymentClient.get({ id });

    const status = result.status ?? "unknown";
    console.log(`[payment] MP status for payment_id=${id}: ${status}`);

    if (status === "approved") {
      const userId = result.external_reference;
      const payerEmail = result.payer?.email;
      console.log(`[payment] approved — userId=${userId} payerEmail=${payerEmail}`);

      try {
        const supabase = getSupabase();
        const activation = await activatePremium(supabase, {
          userId,
          email: payerEmail,
          paymentId: String(id),
        });
        console.log(`[payment] activation result:`, activation);
      } catch (dbErr) {
        console.error("[payment] fallback DB update error:", dbErr);
      }
    }

    res.json({ status, payment_id: result.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error(`[payment] payment-status error for id=${id}:`, message);
    res.status(500).json({ error: message });
  }
});

// GET /api/check-premium?email=...  — checks DB directly (catches webhook activations)
router.get("/check-premium", async (req, res) => {
  const rawEmail = req.query.email as string | undefined;
  const normalizedEmail = normalizeEmail(rawEmail);

  if (!normalizedEmail) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .select("is_premium")
      .eq("email", normalizedEmail)
      .single();

    if (error) {
      console.error(`[payment] check-premium DB error for email=${normalizedEmail}:`, error.message);
      res.status(500).json({ error: error.message });
      return;
    }

    const isPremium = data?.is_premium ?? false;
    console.log(`[payment] check-premium email=${normalizedEmail} is_premium=${isPremium}`);
    res.json({ is_premium: isPremium });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    res.status(500).json({ error: message });
  }
});

// POST /api/webhook  — Mercado Pago notification
router.post("/webhook", async (req, res) => {
  const body = req.body as { action?: string; data?: { id?: string } };
  console.log(`[webhook] received:`, JSON.stringify(body));

  // Always respond 200 immediately so MP doesn't retry endlessly
  res.json({ received: true });

  if (
    body.action !== "payment.updated" &&
    body.action !== "payment.created"
  ) {
    console.log(`[webhook] ignoring action=${body.action}`);
    return;
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    console.warn(`[webhook] no payment_id in body`);
    return;
  }

  console.log(`[webhook] processing payment_id=${paymentId}`);

  try {
    const client = getMercadoPago();
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    const status = payment.status ?? "unknown";
    const payerEmail = payment.payer?.email;
    const userId = payment.external_reference;

    console.log(`[webhook] payment_id=${paymentId} status=${status} email=${payerEmail} userId=${userId}`);

    if (status !== "approved") {
      console.log(`[webhook] status is not approved (${status}), skipping`);
      return;
    }

    const supabase = getSupabase();
    const activation = await activatePremium(supabase, {
      userId,
      email: payerEmail,
      paymentId,
    });

    console.log(`[webhook] activation result:`, JSON.stringify(activation));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("[webhook] error:", message);
  }
});

export default router;
