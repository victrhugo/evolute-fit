import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as { action?: string; data?: { id?: string } };

  if (
    body.action !== "payment.updated" &&
    body.action !== "payment.created"
  ) {
    return res.status(200).json({ received: true });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return res.status(200).json({ received: true });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: "MERCADO_PAGO_ACCESS_TOKEN not configured" });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    if (payment.status === "approved") {
      const userId = payment.external_reference;
      const payerEmail = payment.payer?.email;

      const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      if (!serviceKey) {
        return res.status(500).json({ error: "Supabase key not configured" });
      }

      const supabase = createClient(process.env.SUPABASE_URL!, serviceKey);

      if (userId) {
        const { error } = await supabase
          .from("users")
          .update({ is_premium: true })
          .eq("id", userId);
        if (error) console.error("Supabase update by userId error:", error.message);
      } else if (payerEmail) {
        const { error } = await supabase
          .from("users")
          .update({ is_premium: true })
          .eq("email", payerEmail);
        if (error) console.error("Supabase update by email error:", error.message);
      }

      const { error: paymentUpdateError } = await supabase
        .from("payments")
        .update({ status: "approved" })
        .eq("payment_id", paymentId);
      if (paymentUpdateError) {
        console.error("Payment DB update error:", paymentUpdateError.message);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("Webhook error:", message);
    return res.status(500).json({ error: message });
  }
}
