import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!store) redirect("/onboarding");

  // Fetch payments for this store (RLS allows owner read)
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return <BillingClient store={store} payments={payments || []} />;
}
