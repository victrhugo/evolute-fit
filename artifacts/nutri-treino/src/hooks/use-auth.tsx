import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  isPremium: boolean;
  isLoading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshPremium: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveUserToDb(user: User) {
  try {
    await supabase
      .from("users")
      .upsert({ id: user.id, email: user.email }, { onConflict: "id" });
  } catch {
    // Non-critical
  }
}

async function fetchIsPremium(userId: string): Promise<boolean> {
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const premium = await fetchIsPremium(currentUser.id);
        setIsPremium(premium);
      }
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

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
  }

  return (
    <AuthContext.Provider value={{ user, isPremium, isLoading, signIn, signOut, refreshPremium }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
