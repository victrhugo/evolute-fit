import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

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

  try {
    const { email } = req.body as { email?: string };
    const origin =
      (req.headers.origin as string) ||
      (req.headers.referer as string)?.split("/").slice(0, 3).join("/") ||
      "https://evolute.vercel.app";

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
      success_url: `${origin}/success`,
      cancel_url: `${origin}/`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return res.status(500).json({ error: message });
  }
}
