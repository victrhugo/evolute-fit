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

  // Extract project ref from URL: https://{ref}.supabase.co
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

  // 1. Try Supabase Management API (requires management token, not service key — expected to fail)
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

  // 2. Try verifying the table already exists by checking via Supabase client
  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase
      .from("plans")
      .select("id")
      .limit(1);

    if (!error) {
      res.json({ success: true, method: "table-exists" });
      return;
    }

    // Table doesn't exist — return SQL for manual creation
    res.status(200).json({
      success: false,
      method: "manual-required",
      message:
        "Run the following SQL in your Supabase SQL Editor to enable plan persistence:",
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
