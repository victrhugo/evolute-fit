import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawEmail = req.query.email as string | undefined;
  if (!rawEmail) {
    return res.status(400).json({ error: "email is required" });
  }

  const email = rawEmail.toLowerCase().trim();

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    console.error("[check-premium] Supabase credentials not configured");
    return res.status(500).json({ error: "Supabase not configured" });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase
      .from("users")
      .select("is_premium")
      .eq("email", email)
      .single();

    if (error) {
      console.error(`[check-premium] DB error for email=${email}:`, error.message);
      return res.status(500).json({ error: error.message });
    }

    const isPremium = data?.is_premium ?? false;
    console.log(`[check-premium] email=${email} is_premium=${isPremium}`);
    return res.status(200).json({ is_premium: isPremium });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return res.status(500).json({ error: message });
  }
}
