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

export async function getStoreByUserId(userId: string) {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("user_id", userId)
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
    .select("*, stores(*), product_variants(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createStore(store: {
  user_id: string;
  slug: string;
  name: string;
  description?: string;
  whatsapp_number: string;
  category?: string;
  email?: string;
  setup_complete?: boolean;
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
  has_variants?: boolean;
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
    has_variants: boolean;
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

export async function createProductVariants(
  productId: string,
  variants: Array<{
    name: string;
    option_name: string;
    option_value: string;
    price?: number;
    stock?: number;
    sku?: string;
  }>
) {
  const { data, error } = await supabase
    .from("product_variants")
    .insert(variants.map((v) => ({ ...v, product_id: productId })))
    .select();

  if (error) throw error;
  return data;
}

export async function deleteProductVariants(productId: string) {
  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId);

  if (error) throw error;
}

export async function getProductVariants(productId: string) {
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId);

  if (error) throw error;
  return data;
}

export async function createOrder(order: {
  store_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  items: Array<{
    product_id: string;
    product_name: string;
    variant_id?: string;
    variant_name?: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOrdersByStoreId(storeId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateOrderStatus(
  id: string,
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
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

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, stores(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getReviewsByProductId(productId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getReviewsByStoreId(storeId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createReview(review: {
  product_id: string;
  store_id: string;
  reviewer_name: string;
  rating: number;
  comment?: string;
}) {
  const { data, error } = await supabase
    .from("reviews")
    .insert(review)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProductRating(productId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId);

  if (error) throw error;

  if (!data || data.length === 0) {
    return { count: 0, average: 0 };
  }

  const sum = data.reduce((acc, r) => acc + r.rating, 0);
  return {
    count: data.length,
    average: sum / data.length,
  };
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}
