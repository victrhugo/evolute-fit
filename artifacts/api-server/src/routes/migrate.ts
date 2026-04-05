import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'plans'
      AND policyname = 'Users can manage own plans'
  ) THEN
    CREATE POLICY "Users can manage own plans"
      ON plans FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  payment_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'Users can view own payments'
  ) THEN
    CREATE POLICY "Users can view own payments"
      ON payments FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;
`.trim();

router.post("/migrate", async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({
      success: false,
      message: "Supabase env vars not configured",
      sql: MIGRATION_SQL,
    });
    return;
  }

  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    res.status(500).json({
      success: false,
      message: "Could not parse Supabase project ref from URL",
      sql: MIGRATION_SQL,
    });
    return;
  }

  const projectRef = match[1];

  try {
    const mgmtRes = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: MIGRATION_SQL }),
      },
    );

    if (mgmtRes.ok) {
      res.json({ success: true, method: "management-api" });
      return;
    }
  } catch {
    // fall through
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { error: plansError } = await supabase
      .from("plans")
      .select("id")
      .limit(1);

    const { error: paymentsError } = await supabase
      .from("payments")
      .select("id")
      .limit(1);

    if (!plansError && !paymentsError) {
      res.json({ success: true, method: "tables-exist" });
      return;
    }

    res.status(200).json({
      success: false,
      method: "manual-required",
      message:
        "Run the following SQL in your Supabase SQL Editor to enable plan and payment persistence:",
      sql: MIGRATION_SQL,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: msg,
      sql: MIGRATION_SQL,
    });
  }
});

export default router;
