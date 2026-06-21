import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditProductClient } from "./EditProductClient";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  // Fetch store
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!store || !store.setup_complete) {
    redirect("/onboarding");
  }

  // Fetch product with variants
  const { data: product } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("id", id)
    .eq("store_id", store.id)
    .single();

  if (!product) {
    notFound();
  }

  return <EditProductClient store={store} product={product} />;
}
