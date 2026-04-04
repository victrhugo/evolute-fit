import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  isPremium: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshPremium: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveUserToDb(user: User) {
  if (!supabase) return;
  try {
    await supabase
      .from("users")
      .upsert({ id: user.id, email: user.email }, { onConflict: "id" });
  } catch {
    // Non-critical
  }
}

async function fetchIsPremium(userId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data } = await supabase
      .from("users")
      .select("is_premium")
      .eq("id", userId)
      .single();
    return data?.is_premium ?? false;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPremium = useCallback(async () => {
    if (user) {
      const premium = await fetchIsPremium(user.id);
      setIsPremium(premium);
    }
  }, [user]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Safety timeout: never stay in loading state longer than 5 seconds
    const timeout = setTimeout(() => setIsLoading(false), 5000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const premium = await fetchIsPremium(currentUser.id);
        setIsPremium(premium);
      }
      setIsLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === "SIGNED_IN" && currentUser) {
        await saveUserToDb(currentUser);
        const premium = await fetchIsPremium(currentUser.id);
        setIsPremium(premium);
      }

      if (event === "SIGNED_OUT") {
        setIsPremium(false);
      }

      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    if (!supabase) throw new Error("Auth is not configured.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://evolute-fit.site/auth/callback" },
    });
    if (error) throw error;
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider value={{ user, isPremium, isLoading, signInWithGoogle, signOut, refreshPremium }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
