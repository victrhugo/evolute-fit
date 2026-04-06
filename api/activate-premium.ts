import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { paymentId, userId, email } = req.body as {
    paymentId?: string;
    userId?: string;
    email?: string;
  };

  if (!paymentId) {
    return res.status(400).json({ error: "paymentId is required" });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: "MERCADO_PAGO_ACCESS_TOKEN not configured" });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  // Verify with Mercado Pago that this payment is really approved
  let mpUserId: string | null = null;
  let mpEmail: string | null = null;
  let mpStatus: string = "unknown";

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    mpStatus = payment.status ?? "unknown";
    mpUserId = payment.external_reference ?? null;
    mpEmail = payment.payer?.email?.toLowerCase().trim() ?? null;

    console.log(`[activate-premium] payment_id=${paymentId} status=${mpStatus} mpUserId=${mpUserId} mpEmail=${mpEmail}`);

    if (mpStatus !== "approved") {
      return res.status(402).json({ error: `Payment is not approved (status: ${mpStatus})` });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[activate-premium] MP fetch error:", message);
    return res.status(500).json({ error: `Failed to verify payment: ${message}` });
  }

  // Use MP's userId/email if frontend didn't supply them
  const resolvedUserId = userId ?? mpUserId;
  const resolvedEmail = email?.toLowerCase().trim() ?? mpEmail;

  const supabase = createClient(supabaseUrl, serviceKey);
  let activated = false;

  // Try by userId first
  if (resolvedUserId) {
    try {
      const { error, count } = await supabase
        .from("users")
        .update({ is_premium: true })
        .eq("id", resolvedUserId)
        .select("id", { count: "exact", head: true });

      if (!error && (count ?? 0) > 0) {
        console.log(`[activate-premium] ✓ activated by userId=${resolvedUserId}`);
        activated = true;
      } else {
        console.warn(
          `[activate-premium] userId=${resolvedUserId} matched ${count ?? 0} rows — error=${error?.message ?? "none"}`
        );
      }
    } catch (err: unknown) {
      console.error("[activate-premium] userId update threw:", err instanceof Error ? err.message : String(err));
    }
  }

  // Fall back to email
  if (!activated && resolvedEmail) {
    try {
      const { error, count } = await supabase
        .from("users")
        .update({ is_premium: true })
        .eq("email", resolvedEmail)
        .select("id", { count: "exact", head: true });

      if (!error && (count ?? 0) > 0) {
        console.log(`[activate-premium] ✓ activated by email=${resolvedEmail}`);
        activated = true;
      } else {
        console.warn(
          `[activate-premium] email=${resolvedEmail} matched ${count ?? 0} rows — error=${error?.message ?? "none"}`
        );
      }
    } catch (err: unknown) {
      console.error("[activate-premium] email update threw:", err instanceof Error ? err.message : String(err));
    }
  }

  if (!activated) {
    console.error(`[activate-premium] ✗ could not find user — userId=${resolvedUserId} email=${resolvedEmail}`);
    return res.status(404).json({
      error: "User not found in database",
      debug: { resolvedUserId, resolvedEmail, mpStatus },
    });
  }

  // Update payments table
  try {
    await supabase
      .from("payments")
      .update({ status: "approved" })
      .eq("payment_id", paymentId);
  } catch (err) {
    console.error("[activate-premium] payments table update error:", err);
  }

  return res.status(200).json({ success: true, activated: true });
}
