import { createClient } from "@/lib/supabase/server";
import { ExplorerPage } from "./ExplorerPage";

export default async function ExplorePage() {
  const supabase = await createClient();

  // Fetch public stores (setup complete only)
  const { data: stores } = await supabase
    .from("stores")
    .select("id, slug, name, description, logo_url, banner_url, category, created_at")
    .eq("setup_complete", true)
    .order("created_at", { ascending: false });

  // Fetch distinct categories
  const { data: categoryData } = await supabase
    .from("stores")
    .select("category")
    .eq("setup_complete", true)
    .not("category", "is", null);

  const categories = [
    ...new Set(categoryData?.map((c) => c.category).filter(Boolean) as string[]),
  ].sort();

  return <ExplorerPage stores={stores || []} categories={categories} />;
}
