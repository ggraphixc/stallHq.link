import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch store for this user
  let store = null;
  let products = [];

  try {
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (storeData) {
      // Redirect to onboarding if setup not complete
      if (!storeData.setup_complete) {
        redirect("/onboarding");
      }

      store = storeData;

      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeData.id)
        .order("created_at", { ascending: false });

      products = productsData || [];
    } else {
      // No store - redirect to onboarding
      redirect("/onboarding");
    }
  } catch {
    // Store doesn't exist yet - redirect to onboarding
    redirect("/onboarding");
  }

  return <DashboardClient store={store} products={products} />;
}
