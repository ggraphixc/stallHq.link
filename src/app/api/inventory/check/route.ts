import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendLowStockAlert } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/inventory/check — check for low stock products and send alerts
// Called by cron or manually
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find stores with stock alerts enabled
  const { data: stores, error: storesError } = await supabase
    .from("stores")
    .select("id, name, slug, email, low_stock_threshold, stock_alerts_enabled")
    .eq("stock_alerts_enabled", true)
    .not("email", "is", null);

  if (storesError) return NextResponse.json({ error: storesError.message }, { status: 500 });
  if (!stores || stores.length === 0) return NextResponse.json({ checked: 0, alerts: 0 });

  let alertsSent = 0;

  for (const store of stores) {
    const threshold = store.low_stock_threshold || 5;

    // Check products with variants
    const { data: products } = await supabase
      .from("products")
      .select("id, name, in_stock, product_variants(id, option_value, stock)")
      .eq("store_id", store.id)
      .eq("in_stock", true);

    if (!products) continue;

    const lowStockItems: { name: string; stock: number; variant?: string }[] = [];

    for (const product of products) {
      if (product.product_variants && product.product_variants.length > 0) {
        // Check variant stocks
        for (const variant of product.product_variants) {
          if (variant.stock !== null && variant.stock <= threshold) {
            lowStockItems.push({
              name: product.name,
              stock: variant.stock,
              variant: variant.option_value,
            });
          }
        }
      }
    }

    if (lowStockItems.length > 0 && store.email) {
      const sent = await sendLowStockAlert({
        storeEmail: store.email,
        storeName: store.name,
        storeSlug: store.slug,
        items: lowStockItems,
        threshold,
      });
      if (sent) alertsSent++;
    }
  }

  return NextResponse.json({ checked: stores.length, alerts: alertsSent });
}
