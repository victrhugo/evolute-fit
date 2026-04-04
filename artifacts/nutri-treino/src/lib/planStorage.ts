import { supabase } from "./supabase";
import { GeneratedPlan } from "./planGenerator";

const LOCAL_KEY = "nutri-treino-plan";

// ─── localStorage helpers (always available) ───────────────────────────────

export function savePlanLocally(plan: GeneratedPlan): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(plan));
}

export function loadPlanLocally(): GeneratedPlan | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GeneratedPlan;
  } catch {
    return null;
  }
}

export function clearLocalPlan(): void {
  localStorage.removeItem(LOCAL_KEY);
}

// ─── Supabase helpers (authenticated users only) ───────────────────────────

export async function savePlanToCloud(userId: string, plan: GeneratedPlan): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Delete any existing plans for this user, then insert fresh
    await supabase.from("plans").delete().eq("user_id", userId);

    const { error } = await supabase.from("plans").insert({
      user_id: userId,
      content: JSON.stringify(plan),
    });

    if (error) {
      console.warn("[planStorage] Supabase save failed:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[planStorage] Supabase save exception:", e);
    return false;
  }
}

export async function loadPlanFromCloud(userId: string): Promise<GeneratedPlan | null> {
  if (!supabase) return null;
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
    const query = supabase
      .from("plans")
      .select("content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const result = await Promise.race([query, timeout]);
    if (!result) return null;
    const { data, error } = result as Awaited<typeof query>;
    if (error || !data) return null;
    return JSON.parse(data.content) as GeneratedPlan;
  } catch {
    return null;
  }
}

export async function deletePlanFromCloud(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("plans").delete().eq("user_id", userId);
  } catch {
    // silent
  }
}

// ─── Unified save: cloud + local ──────────────────────────────────────────

export async function savePlan(userId: string | null, plan: GeneratedPlan): Promise<void> {
  savePlanLocally(plan);
  if (userId) {
    await savePlanToCloud(userId, plan);
  }
}

// ─── Unified load: cloud-first, local fallback ────────────────────────────

export async function loadPlan(userId: string | null): Promise<GeneratedPlan | null> {
  if (userId) {
    const cloudPlan = await loadPlanFromCloud(userId);
    if (cloudPlan) {
      savePlanLocally(cloudPlan); // sync local copy
      return cloudPlan;
    }
  }
  return loadPlanLocally();
}

// ─── Check if user has any saved plan ─────────────────────────────────────

export async function hasSavedPlan(userId: string | null): Promise<boolean> {
  if (userId && supabase) {
    try {
      const { data } = await supabase
        .from("plans")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (data) return true;
    } catch {
      // fall through to local check
    }
  }
  return loadPlanLocally() !== null;
}
