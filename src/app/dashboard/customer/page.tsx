import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerDashboard } from "./CustomerDashboard";

export default async function CustomerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch customer orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*, stores(name, slug)")
    .eq("customer_email", user.email)
    .order("created_at", { ascending: false });

  // Check if user has a store (to show/hide create store button)
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug")
    .eq("user_id", user.id)
    .single();

  return (
    <CustomerDashboard
      user={{ id: user.id, email: user.email || "", name: user.user_metadata?.name || "" }}
      orders={orders || []}
      existingStore={store}
    />
  );
}
