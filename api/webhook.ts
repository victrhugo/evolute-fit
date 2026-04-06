import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

async function processPayment(paymentId: string): Promise<void> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("[webhook] MERCADO_PAGO_ACCESS_TOKEN not configured");
    return;
  }

  const client = new MercadoPagoConfig({ accessToken });
  const paymentClient = new Payment(client);
  const payment = await paymentClient.get({ id: paymentId });

  const status = payment.status ?? "unknown";
  const userId = payment.external_reference ?? null;
  const payerEmail = normalizeEmail(payment.payer?.email);

  console.log(
    `[webhook] payment_id=${paymentId} status=${status} userId=${userId} email=${payerEmail}`
  );

  if (status !== "approved") {
    console.log(`[webhook] status not approved (${status}), skipping DB update`);
    return;
  }

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!serviceKey || !process.env.SUPABASE_URL) {
    console.error("[webhook] Supabase credentials not configured");
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, serviceKey);

  // Try userId first, then fall back to email
  let activated = false;

  if (userId) {
    const { error, count } = await supabase
      .from("users")
      .update({ is_premium: true })
      .eq("id", userId)
      .select("id", { count: "exact", head: true });

    if (!error && (count ?? 0) > 0) {
      console.log(`[webhook] premium activated by userId=${userId}`);
      activated = true;
    } else {
      console.warn(
        `[webhook] userId=${userId} not found — error=${error?.message ?? "none"} count=${count}`
      );
    }
  }

  if (!activated && payerEmail) {
    const { error, count } = await supabase
      .from("users")
      .update({ is_premium: true })
      .eq("email", payerEmail)
      .select("id", { count: "exact", head: true });

    if (!error && (count ?? 0) > 0) {
      console.log(`[webhook] premium activated by email=${payerEmail}`);
      activated = true;
    } else {
      console.warn(
        `[webhook] email=${payerEmail} not found — error=${error?.message ?? "none"} count=${count}`
      );
    }
  }

  if (!activated) {
    console.error(
      `[webhook] could not activate premium — no matching user for userId=${userId} email=${payerEmail}`
    );
  }

  // Update payments table regardless
  const { error: pmtErr } = await supabase
    .from("payments")
    .update({ status: "approved" })
    .eq("payment_id", String(paymentId));

  if (pmtErr) {
    console.error("[webhook] payments table update error:", pmtErr.message);
  } else {
    console.log(`[webhook] payments table updated for payment_id=${paymentId}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const timestamp = new Date().toISOString();
  console.log(`[webhook] ${timestamp} — method=${req.method}`);
  console.log("[webhook] headers:", JSON.stringify(req.headers));
  console.log("[webhook] body:", JSON.stringify(req.body));

  // Always respond 200 immediately — MP considers any other status a failure
  res.sendStatus(200);

  if (req.method !== "POST") {
    console.log(`[webhook] non-POST request (${req.method}), nothing to process`);
    return;
  }

  const body = req.body as {
    action?: string;
    data?: { id?: string };
    type?: string;
  };

  const action = body.action ?? body.type ?? "";
  const paymentId = body.data?.id;

  console.log(`[webhook] action=${action} payment_id=${paymentId ?? "none"}`);

  if (!paymentId) {
    console.log("[webhook] no payment_id in body, skipping");
    return;
  }

  // Process asynchronously — response already sent
  processPayment(paymentId).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] async processing error:", msg);
  });
}
