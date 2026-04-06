import { Router } from "express";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const router = Router();

function getMercadoPago() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
  return new MercadoPagoConfig({ accessToken });
}

function getSupabase() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!key) throw new Error("Supabase key not configured");
  return createClient(process.env.SUPABASE_URL!, key);
}

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

    const client = getMercadoPago();
    const paymentClient = new Payment(client);

    const result = await paymentClient.create({
      body: {
        transaction_amount: 14.9,
        description: "Evolute Premium",
        payment_method_id: "pix",
        payer: {
          email,
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
      res.status(500).json({ error: "Falha ao gerar QR code PIX" });
      return;
    }

    try {
      const supabase = getSupabase();
      await supabase.from("payments").insert({
        user_id: userId,
        payment_id: String(result.id),
        status: result.status ?? "pending",
      });
    } catch (dbErr) {
      console.error("Failed to save payment to DB:", dbErr);
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
    console.error("create-payment error:", JSON.stringify({ message, cause, err }, null, 2));
    res.status(500).json({ error: message, details: cause });
  }
});

router.get("/payment-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const client = getMercadoPago();
    const paymentClient = new Payment(client);

    const result = await paymentClient.get({ id });

    // Fallback: if payment is approved, update DB immediately
    // This ensures premium is activated even if the webhook was missed
    if (result.status === "approved") {
      try {
        const supabase = getSupabase();
        const userId = result.external_reference;
        const payerEmail = result.payer?.email;

        if (userId) {
          await supabase
            .from("users")
            .update({ is_premium: true })
            .eq("id", userId);
        } else if (payerEmail) {
          await supabase
            .from("users")
            .update({ is_premium: true })
            .eq("email", payerEmail);
        }

        await supabase
          .from("payments")
          .update({ status: "approved" })
          .eq("payment_id", String(id));
      } catch (dbErr) {
        console.error("Fallback DB update error:", dbErr);
      }
    }

    res.json({ status: result.status, payment_id: result.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    res.status(500).json({ error: message });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const body = req.body as { action?: string; data?: { id?: string } };

    if (
      body.action !== "payment.updated" &&
      body.action !== "payment.created"
    ) {
      res.json({ received: true });
      return;
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      res.json({ received: true });
      return;
    }

    const client = getMercadoPago();
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    if (payment.status === "approved") {
      const userId = payment.external_reference;
      const payerEmail = payment.payer?.email;
      const supabase = getSupabase();

      if (userId) {
        const { error } = await supabase
          .from("users")
          .update({ is_premium: true })
          .eq("id", userId);
        if (error) {
          console.error("Supabase update by userId error:", error.message);
        }
      } else if (payerEmail) {
        const { error } = await supabase
          .from("users")
          .update({ is_premium: true })
          .eq("email", payerEmail);
        if (error) {
          console.error("Supabase update by email error:", error.message);
        }
      }

      const { error: paymentUpdateError } = await supabase
        .from("payments")
        .update({ status: "approved" })
        .eq("payment_id", paymentId);
      if (paymentUpdateError) {
        console.error("Payment DB update error:", paymentUpdateError.message);
      }
    }

    res.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("Webhook processing error:", message);
    res.status(500).json({ error: message });
  }
});

export default router;
