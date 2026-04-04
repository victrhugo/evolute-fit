import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { GeneratedPlan } from "@/lib/planGenerator";
import { savePlanLocally, loadPlanLocally, clearLocalPlan, savePlanToCloud, deletePlanFromCloud } from "@/lib/planStorage";

interface PlanContextValue {
  plan: GeneratedPlan | null;
  isLoadingPlan: boolean;
  setPlanAndSave: (plan: GeneratedPlan, userId: string | null) => void;
  clearPlan: (userId: string | null) => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Step 1: Show local plan immediately (sync, no delay)
    const local = loadPlanLocally();
    if (local) {
      setPlan(local);
      setIsLoadingPlan(false);
    }

    // Step 2: Get user via getUser() then fetch from cloud in background
    async function syncFromCloud() {
      if (!supabase) {
        if (!local) setIsLoadingPlan(false);
        return;
      }

      let userId: string | null = null;
      try {
        const raceResult = await Promise.race([
          supabase.auth.getUser(),
          new Promise<{ data: { user: null } }>((resolve) =>
            setTimeout(() => resolve({ data: { user: null } }), 6000)
          ),
        ]);
        userId = (raceResult as any)?.data?.user?.id ?? null;
        console.log("[PlanContext] user.id:", userId);
      } catch (e) {
        console.warn("[PlanContext] getUser error:", e);
      }

      if (cancelled) return;

      if (!userId) {
        if (!local) setIsLoadingPlan(false);
        return;
      }

      // Step 3: Fetch most recent plan from Supabase for this user
      try {
        const queryResult = await Promise.race([
          supabase
            .from("plans")
            .select("content, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          new Promise<{ data: null; error: null }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: null }), 5000)
          ),
        ]);

        if (cancelled) return;

        const { data } = queryResult as { data: { content: string; created_at: string } | null; error: unknown };
        console.log("[PlanContext] cloud plan row:", data);

        if (data?.content) {
          const cloudPlan = JSON.parse(data.content) as GeneratedPlan;
          savePlanLocally(cloudPlan);
          setPlan(cloudPlan);
        }
      } catch (e) {
        console.warn("[PlanContext] cloud fetch error:", e);
      } finally {
        if (!cancelled) setIsLoadingPlan(false);
      }
    }

    syncFromCloud();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPlanAndSave = useCallback((newPlan: GeneratedPlan, userId: string | null) => {
    savePlanLocally(newPlan);
    setPlan(newPlan);
    if (userId && supabase) {
      savePlanToCloud(userId, newPlan).catch((e) =>
        console.warn("[PlanContext] cloud save error:", e)
      );
    }
  }, []);

  const clearPlan = useCallback(async (userId: string | null) => {
    clearLocalPlan();
    setPlan(null);
    if (userId && supabase) {
      await deletePlanFromCloud(userId).catch(() => {});
    }
  }, []);

  return (
    <PlanContext.Provider value={{ plan, isLoadingPlan, setPlanAndSave, clearPlan }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
