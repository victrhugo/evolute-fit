import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, userId, firstName, lastName, cpf } = req.body as {
    email?: string;
    userId?: string;
    firstName?: string;
    lastName?: string;
    cpf?: string;
  };

  if (!email || !userId) {
    return res.status(400).json({ error: "email e userId são obrigatórios" });
  }
  if (!cpf) {
    return res.status(400).json({ error: "CPF é obrigatório para pagamento PIX" });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: "MERCADO_PAGO_ACCESS_TOKEN not configured" });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);

    const result = await paymentClient.create({
      body: {
        transaction_amount: 14.9,
        description: "Evolute Premium",
        payment_method_id: "pix",
        payer: {
          email: email.toLowerCase().trim(),
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
      console.error("[create-payment] no QR code in MP response:", JSON.stringify(result));
      return res.status(500).json({ error: "Falha ao gerar QR code PIX" });
    }

    console.log(`[create-payment] PIX created — payment_id=${result.id} status=${result.status}`);

    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
      if (serviceKey && process.env.SUPABASE_URL) {
        const supabase = createClient(process.env.SUPABASE_URL, serviceKey);
        await supabase.from("payments").insert({
          user_id: userId,
          payment_id: String(result.id),
          status: result.status ?? "pending",
        });
      }
    } catch (dbErr) {
      console.error("[create-payment] failed to save payment to DB:", dbErr);
    }

    return res.status(200).json({
      qr_code_base64: txData.qr_code_base64,
      pix_code: txData.qr_code,
      payment_id: result.id,
      status: result.status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    const cause = (err as Record<string, unknown>)?.cause;
    console.error("[create-payment] error:", JSON.stringify({ message, cause }));
    return res.status(500).json({ error: message, details: cause });
  }
}
