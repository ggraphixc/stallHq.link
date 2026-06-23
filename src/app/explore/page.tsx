import { createClient } from "@/lib/supabase/server";
import { ExplorerPage } from "./ExplorerPage";

export default async function ExplorePage() {
  const supabase = await createClient();

  // Fetch public stores with product counts
  const { data: stores } = await supabase
    .from("stores")
    .select("id, slug, name, description, logo_url, banner_url, category, created_at, plan, verified")
    .eq("setup_complete", true)
    .order("created_at", { ascending: false });

  // Fetch product counts per store
  const storeIds = stores?.map((s) => s.id) || [];
  const { data: productCounts } = await supabase
    .from("products")
    .select("store_id")
    .in("store_id", storeIds)
    .eq("in_stock", true);

  const countMap: Record<string, number> = {};
  productCounts?.forEach((p) => {
    countMap[p.store_id] = (countMap[p.store_id] || 0) + 1;
  });

  // Fetch distinct categories
  const { data: categoryData } = await supabase
    .from("stores")
    .select("category")
    .eq("setup_complete", true)
    .not("category", "is", null);

  const categories = [
    ...new Set(categoryData?.map((c) => c.category).filter(Boolean) as string[]),
  ].sort();

  const storesWithCounts = stores?.map((s) => ({
    ...s,
    productCount: countMap[s.id] || 0,
  })) || [];

  return <ExplorerPage stores={storesWithCounts} categories={categories} />;
}
