import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const timestamp = new Date().toISOString();
  console.log(`[webhook] ${timestamp} method=${req.method}`);
  console.log("[webhook] body:", JSON.stringify(req.body ?? null));

  // Non-POST (e.g. MP validation ping) — just return 200
  if (req.method !== "POST") {
    return res.status(200).json({ received: true });
  }

  // Extract payment ID
  const body = req.body as {
    action?: string;
    type?: string;
    data?: { id?: string };
  } | null;

  const paymentId = body?.data?.id ?? null;
  const action = body?.action ?? body?.type ?? "unknown";
  console.log(`[webhook] action=${action} payment_id=${paymentId ?? "none"}`);

  if (!paymentId) {
    console.log("[webhook] no payment_id — nothing to process");
    return res.status(200).json({ received: true });
  }

  // Process payment — NEVER throws, all errors are caught
  try {
    await processPayment(paymentId);
  } catch (err: unknown) {
    // Log but do not propagate — we must always return 200
    console.error("[webhook] unexpected error:", err instanceof Error ? err.message : String(err));
  }

  // Always 200 — Mercado Pago considers anything else a failure
  return res.status(200).json({ received: true });
}

async function processPayment(paymentId: string): Promise<void> {
  // 1. Fetch payment from Mercado Pago
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("[webhook] MERCADO_PAGO_ACCESS_TOKEN not configured");
    return;
  }

  console.log(`[webhook] fetching payment_id=${paymentId} from Mercado Pago`);
  const client = new MercadoPagoConfig({ accessToken });
  const paymentClient = new Payment(client);
  const payment = await paymentClient.get({ id: paymentId });

  const status = payment.status ?? "unknown";
  const userId = payment.external_reference ?? null;
  const rawEmail = payment.payer?.email ?? null;
  const payerEmail = rawEmail ? rawEmail.toLowerCase().trim() : null;

  console.log(
    `[webhook] payment_id=${paymentId} status=${status} userId=${userId} email=${payerEmail}`
  );

  if (status !== "approved") {
    console.log(`[webhook] status is "${status}" — skipping DB update`);
    return;
  }

  // 2. Connect to Supabase
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? null;
  const supabaseUrl = process.env.SUPABASE_URL ?? null;

  if (!serviceKey || !supabaseUrl) {
    console.error("[webhook] Supabase credentials not configured");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  let activated = false;

  // 3a. Try userId first
  if (userId) {
    const { error, count } = await supabase
      .from("users")
      .update({ is_premium: true })
      .eq("id", userId)
      .select("id", { count: "exact", head: true });

    if (!error && (count ?? 0) > 0) {
      console.log(`[webhook] ✓ premium activated by userId=${userId}`);
      activated = true;
    } else {
      console.warn(
        `[webhook] userId=${userId} — rows matched=${count ?? 0} error=${error?.message ?? "none"}`
      );
    }
  }

  // 3b. Fall back to email
  if (!activated && payerEmail) {
    const { error, count } = await supabase
      .from("users")
      .update({ is_premium: true })
      .eq("email", payerEmail)
      .select("id", { count: "exact", head: true });

    if (!error && (count ?? 0) > 0) {
      console.log(`[webhook] ✓ premium activated by email=${payerEmail}`);
      activated = true;
    } else {
      console.warn(
        `[webhook] email=${payerEmail} — rows matched=${count ?? 0} error=${error?.message ?? "none"}`
      );
    }
  }

  if (!activated) {
    console.error(
      `[webhook] ✗ could not find user — userId=${userId} email=${payerEmail}`
    );
  }

  // 4. Update payments table
  const { error: pmtErr } = await supabase
    .from("payments")
    .update({ status: "approved" })
    .eq("payment_id", String(paymentId));

  if (pmtErr) {
    console.error("[webhook] payments table update error:", pmtErr.message);
  } else {
    console.log(`[webhook] payments table updated — payment_id=${paymentId}`);
  }
}
