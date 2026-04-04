import { Router } from "express";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const router = Router();

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-03-31.basil",
  });
}

function getSupabase() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!key) throw new Error("Supabase key not configured");
  return createClient(process.env.SUPABASE_URL!, key);
}

router.post("/create-checkout-session", async (req, res) => {
  try {
    const stripe = getStripe();
    const { email, userId } = req.body as { email?: string; userId?: string };
    const origin =
      (req.headers.origin as string) ||
      (req.headers.referer as string)?.split("/").slice(0, 3).join("/") ||
      "http://localhost:24870";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Evolute Premium",
              description:
                "Acesso completo: plano detalhado + Coach IA personalizado",
            },
            unit_amount: 1490,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      ...(email ? { customer_email: email } : {}),
      ...(userId ? { client_reference_id: userId } : {}),
      success_url: `${origin}/success`,
      cancel_url: `${origin}/`,
    });

    res.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    res.status(500).json({ error: message });
  }
});

router.post("/webhook", async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse((req.body as Buffer).toString()) as Stripe.Event;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const email = session.customer_email;

    try {
      const supabase = getSupabase();

      if (userId) {
        // Preferred: update by user ID (reliable, no email collision)
        const { error } = await supabase
          .from("users")
          .update({ is_premium: true })
          .eq("id", userId);

        if (error) {
          console.error("Supabase update by userId error:", error.message);
        }
      } else if (email) {
        // Fallback: update by email if userId was not provided
        const { error } = await supabase
          .from("users")
          .update({ is_premium: true })
          .eq("email", email);

        if (error) {
          console.error("Supabase update by email error:", error.message);
        }
      }
    } catch (e) {
      console.error("Failed to update premium status:", e);
    }
  }

  res.json({ received: true });
});

export default router;
