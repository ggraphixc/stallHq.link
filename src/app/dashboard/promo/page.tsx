import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PromoClient } from "./PromoClient";

export default async function PromoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let store = null;
  let products = [];

  try {
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (storeData) {
      if (!storeData.setup_complete) {
        redirect("/onboarding");
      }
      store = storeData;

      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, price, image_url")
        .eq("store_id", storeData.id)
        .order("created_at", { ascending: false });

      products = productsData || [];
    } else {
      redirect("/onboarding");
    }
  } catch {
    redirect("/onboarding");
  }

  return <PromoClient store={store} products={products} />;
}
