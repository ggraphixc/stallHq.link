import React, { createContext, useContext, useEffect, useState } from "react";
import { router } from "expo-router";
import { Session, User } from "@supabase/supabase-js";
import { supabase, Store } from "./supabase";

export const WEB_API_URL =
  process.env.EXPO_PUBLIC_WEB_API_URL || "https://hqlink.vercel.app";

export type SignupRole = "vendor" | "customer";

interface PendingSignup {
  email: string;
  password: string;
  role: SignupRole;
  name: string;
  storeName?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  store: Store | null;
  /** True until the user's store row (if any) has been fetched. */
  storeLoaded: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  /** Mirrors the web flow: create user via /api/auth/signup, then email a Brevo code. */
  startSignup: (input: { name: string; email: string; password: string; role: SignupRole; storeName?: string }) => Promise<{ error?: string }>;
  /** Verify the 6-digit code, sign in, and create the store for vendor role. */
  completeSignup: (code: string) => Promise<{ error?: string; needsSignIn?: boolean }>;
  resendCode: () => Promise<{ error?: string }>;
  /** Existing customer → create a store under their account. */
  becomeVendor: (storeName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshStore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  store: null,
  storeLoaded: false,
  loading: true,
  signIn: async () => ({}),
  startSignup: async () => ({}),
  completeSignup: async () => ({}),
  resendCode: async () => ({}),
  becomeVendor: async () => ({}),
  signOut: async () => {},
  refreshStore: async () => {},
});

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base || "store";
  for (let i = 1; i < 20; i++) {
    const { data } = await supabase.from("stores").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const pendingRef = React.useRef<PendingSignup | null>(null);

  const fetchStore = async (userId: string, signal?: { cancelled: boolean }) => {
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (signal?.cancelled) return;
    setStore(data);
    setStoreLoaded(true);
  };

  useEffect(() => {
    let cancelled = false;
    const signal = { cancelled: false };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      if (session?.user) fetchStore(session.user.id, signal);
      else setStoreLoaded(true);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setSession(session);
      if (session?.user) {
        setStoreLoaded(false);
        fetchStore(session.user.id, signal);
      } else {
        setStore(null);
        setStoreLoaded(true);
      }
    });

    return () => { cancelled = true; signal.cancelled = true; subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  /** Create account through the web API (admin create, no Supabase email) + send Brevo code. */
  const startSignup: AuthContextType["startSignup"] = async ({ name, email, password, role, storeName }) => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      return { error: "Please fill all fields and use a 6+ character password" };
    }
    try {
      const signupRes = await fetch(`${WEB_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() }),
      });
      const signupData = await signupRes.json();
      if (!signupRes.ok) return { error: signupData.error || "Failed to create account" };

      const codeRes = await fetch(`${WEB_API_URL}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), type: "signup" }),
      });
      if (!codeRes.ok) {
        const d = await codeRes.json();
        return { error: d.error || "Failed to send verification code" };
      }

      pendingRef.current = { email: email.trim(), password, role, name: name.trim(), storeName };
      return {};
    } catch {
      return { error: "Network error — check your connection" };
    }
  };

  const completeSignup: AuthContextType["completeSignup"] = async (code) => {
    const pending = pendingRef.current;
    if (!pending) return { error: "Signup session expired — please start again", needsSignIn: true };

    try {
      const verifyRes = await fetch(`${WEB_API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pending.email, code, type: "signup" }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) return { error: verifyData.error || "Invalid or expired code" };

      // Email now confirmed → sign in, then create the store for vendors.
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: pending.email,
        password: pending.password,
      });
      if (signInError || !authData.session) {
        return { error: "Account verified — please sign in", needsSignIn: true };
      }
      setSession(authData.session);

      if (pending.role === "vendor") {
        const baseSlug = makeSlug(pending.storeName || pending.name);
        const slug = await ensureUniqueSlug(baseSlug);
        const { error: storeError } = await supabase.from("stores").insert({
          name: pending.storeName || pending.name,
          slug,
          user_id: authData.user.id,
          whatsapp_number: "",
          plan: "trial",
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          setup_complete: true,
        });
        if (storeError) return { error: storeError.message };
      }

      const user = authData.user;
      if (pending.role === "vendor") await fetchStore(user.id);
      else setStoreLoaded(true);
      pendingRef.current = null;
      return {};
    } catch {
      return { error: "Network error while verifying" };
    }
  };

  const resendCode: AuthContextType["resendCode"] = async () => {
    const pending = pendingRef.current;
    if (!pending) return { error: "Signup session expired" };
    try {
      const res = await fetch(`${WEB_API_URL}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pending.email, type: "signup" }),
      });
      if (!res.ok) return { error: "Failed to resend code" };
      return {};
    } catch {
      return { error: "Network error" };
    }
  };

  const becomeVendor: AuthContextType["becomeVendor"] = async (storeName) => {
    const user = session?.user;
    if (!user) return { error: "You must be signed in" };
    if (!storeName.trim()) return { error: "Store name is required" };
    const baseSlug = makeSlug(storeName.trim());
    const slug = await ensureUniqueSlug(baseSlug);
    const { error } = await supabase.from("stores").insert({
      name: storeName.trim(),
      slug,
      user_id: user.id,
      whatsapp_number: "",
      plan: "trial",
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      setup_complete: true,
    });
    if (error) return { error: error.message };
    await fetchStore(user.id);
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setStore(null);
    setStoreLoaded(true);
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
        storeLoaded,
        loading,
        signIn,
        startSignup,
        completeSignup,
        resendCode,
        becomeVendor,
        signOut,
        refreshStore,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
