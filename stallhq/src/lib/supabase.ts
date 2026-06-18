import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getStoreBySlug(slug: string) {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

export async function getProductsByStoreId(storeId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("in_stock", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, stores(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createStore(store: {
  slug: string;
  name: string;
  description?: string;
  whatsapp_number: string;
}) {
  const { data, error } = await supabase
    .from("stores")
    .insert(store)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createProduct(product: {
  store_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
}) {
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
    in_stock: boolean;
  }>
) {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
