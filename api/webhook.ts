import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Non-POST requests (e.g. MP validation ping)
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  // Respond immediately — Mercado Pago requires 200 to mark delivery as success
  res.status(200).json({ received: true });

  // Process AFTER responding — function stays alive until this await resolves
  try {
    console.log("[webhook] received:", JSON.stringify(req.body ?? null));

    const body = req.body as {
      action?: string;
      type?: string;
      data?: { id?: string };
    } | null;

    const paymentId = body?.data?.id ?? null;
    const action = body?.action ?? body?.type ?? "unknown";
    console.log(`[webhook] action=${action} payment_id=${paymentId ?? "none"}`);

    if (!paymentId) {
      console.log("[webhook] no payment_id in payload — done");
      return;
    }

    await processPayment(String(paymentId));
  } catch (err: unknown) {
    console.error("[webhook] fatal error:", err instanceof Error ? err.message : String(err));
  }
}

async function processPayment(paymentId: string): Promise<void> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN ?? null;
  if (!accessToken) {
    console.error("[webhook] MERCADO_PAGO_ACCESS_TOKEN not configured");
    return;
  }

  let payment;
  try {
    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);
    payment = await paymentClient.get({ id: paymentId });
    console.log(`[webhook] fetched payment_id=${paymentId} status=${payment?.status}`);
  } catch (err: unknown) {
    console.error("[webhook] failed to fetch payment from MP:", err instanceof Error ? err.message : String(err));
    return;
  }

  const status = payment?.status ?? "unknown";
  const userId = payment?.external_reference ?? null;
  const rawEmail = payment?.payer?.email ?? null;
  const payerEmail = rawEmail ? rawEmail.toLowerCase().trim() : null;

  console.log(`[webhook] status=${status} userId=${userId} email=${payerEmail}`);

  if (status !== "approved") {
    console.log(`[webhook] not approved (${status}) — nothing to do`);
    return;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? null;
  const supabaseUrl = process.env.SUPABASE_URL ?? null;
  if (!serviceKey || !supabaseUrl) {
    console.error("[webhook] Supabase credentials not configured");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  let activated = false;

  // Try userId first
  if (userId) {
    try {
      const { error, count } = await supabase
        .from("users")
        .update({ is_premium: true })
        .eq("id", userId)
        .select("id", { count: "exact", head: true });

      if (!error && (count ?? 0) > 0) {
        console.log(`[webhook] ✓ premium activated by userId=${userId}`);
        activated = true;
      } else {
        console.warn(`[webhook] userId=${userId} matched ${count ?? 0} rows — error=${error?.message ?? "none"}`);
      }
    } catch (err: unknown) {
      console.error("[webhook] userId update threw:", err instanceof Error ? err.message : String(err));
    }
  }

  // Fall back to email
  if (!activated && payerEmail) {
    try {
      const { error, count } = await supabase
        .from("users")
        .update({ is_premium: true })
        .eq("email", payerEmail)
        .select("id", { count: "exact", head: true });

      if (!error && (count ?? 0) > 0) {
        console.log(`[webhook] ✓ premium activated by email=${payerEmail}`);
        activated = true;
      } else {
        console.warn(`[webhook] email=${payerEmail} matched ${count ?? 0} rows — error=${error?.message ?? "none"}`);
      }
    } catch (err: unknown) {
      console.error("[webhook] email update threw:", err instanceof Error ? err.message : String(err));
    }
  }

  if (!activated) {
    console.error(`[webhook] ✗ no user found for userId=${userId} email=${payerEmail}`);
  }

  // Update payments table
  try {
    const { error } = await supabase
      .from("payments")
      .update({ status: "approved" })
      .eq("payment_id", paymentId);
    if (error) console.error("[webhook] payments table update error:", error.message);
    else console.log(`[webhook] payments table updated — payment_id=${paymentId}`);
  } catch (err: unknown) {
    console.error("[webhook] payments table threw:", err instanceof Error ? err.message : String(err));
  }
}
