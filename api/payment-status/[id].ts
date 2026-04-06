import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const paymentId = req.query.id as string;
  if (!paymentId) {
    return res.status(400).json({ error: "payment id required" });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: "MERCADO_PAGO_ACCESS_TOKEN not configured" });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    const status = payment.status ?? "unknown";
    console.log(`[payment-status] id=${paymentId} status=${status}`);

    if (status === "approved") {
      const userId = payment.external_reference ?? null;
      const payerEmail = normalizeEmail(payment.payer?.email);

      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
      const supabaseUrl = process.env.SUPABASE_URL;

      if (serviceKey && supabaseUrl) {
        const supabase = createClient(supabaseUrl, serviceKey);
        let activated = false;

        if (userId) {
          const { error, count } = await supabase
            .from("users")
            .update({ is_premium: true })
            .eq("id", userId)
            .select("id", { count: "exact", head: true });
          if (!error && (count ?? 0) > 0) {
            activated = true;
            console.log(`[payment-status] premium activated by userId=${userId}`);
          }
        }

        if (!activated && payerEmail) {
          const { error, count } = await supabase
            .from("users")
            .update({ is_premium: true })
            .eq("email", payerEmail)
            .select("id", { count: "exact", head: true });
          if (!error && (count ?? 0) > 0) {
            activated = true;
            console.log(`[payment-status] premium activated by email=${payerEmail}`);
          }
        }

        if (!activated) {
          console.warn(`[payment-status] could not find user — userId=${userId} email=${payerEmail}`);
        }

        await supabase
          .from("payments")
          .update({ status: "approved" })
          .eq("payment_id", paymentId);
      }
    }

    return res.status(200).json({ status, payment_id: payment.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error(`[payment-status] error id=${paymentId}:`, message);
    return res.status(500).json({ error: message });
  }
}
