import React, { createContext, useContext, useEffect, useState } from "react";
import { router } from "expo-router";
import { Session, User } from "@supabase/supabase-js";
import { supabase, Store } from "./supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  store: Store | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    storeName: string
  ) => Promise<{ error?: string; requiresVerification?: boolean }>;
  signOut: () => Promise<void>;
  refreshStore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  store: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  refreshStore: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStore = async (userId: string, signal?: { cancelled: boolean }) => {
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (!signal?.cancelled) setStore(data);
  };

  useEffect(() => {
    let cancelled = false;
    const signal = { cancelled: false };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      if (session?.user) fetchStore(session.user.id, signal);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setSession(session);
      if (session?.user) fetchStore(session.user.id, signal);
      else setStore(null);
    });

    return () => { cancelled = true; signal.cancelled = true; subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message };
  };

  const signUp = async (email: string, password: string, storeName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { store_name: storeName },
      },
    });

    if (error) return { error: error.message };

    // Create store after signup
    if (data.user) {
      const slug = storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { error: storeError } = await supabase.from("stores").insert({
        name: storeName,
        slug,
        user_id: data.user.id,
        whatsapp_number: "",
        plan: "trial",
        trial_ends_at: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        // The store is browsable once the account is created. `is_active` does
        // not exist on stores — discoverability is driven by `setup_complete`.
        setup_complete: true,
      });

      if (storeError) return { error: storeError.message };
    }

    const requiresVerification = !data.session;
    return { requiresVerification };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear state immediately (don't wait on the auth subscription) so no
    // screen lingers on a stale "Loading..." state after signing out.
    setSession(null);
    setStore(null);
    router.replace("/(auth)/select-role");
  };

  const refreshStore = async () => {
    if (session?.user) await fetchStore(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        store,
        loading,
        signIn,
        signUp,
        signOut,
        refreshStore,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
