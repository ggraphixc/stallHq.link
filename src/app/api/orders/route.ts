import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";
import { sendOrderNotification } from "@/lib/email";
import { rateLimit, addRateLimitHeaders } from "@/lib/rateLimit";

const orderRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 orders per minute per IP
});

export async function GET(request: NextRequest) {
  try {
    const authSupabase = await createAuthClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");

    if (!storeId) {
      return NextResponse.json(
        { error: "store_id is required" },
        { status: 400 }
      );
    }

    // Verify user owns this store
    const { data: store } = await authSupabase
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .single();

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const { data: orders, error } = await authSupabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = await orderRateLimit(request);
    if (!rl.success) return rl.response!;

    const body = await request.json();

    // Validate required fields
    if (!body.store_id || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: "store_id and items are required" }, { status: 400 });
    }

    // Use service role key — orders are placed by anonymous customers
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate store exists
    const { data: store } = await supabase
      .from("stores")
      .select("id, name, email")
      .eq("id", body.store_id)
      .single();

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert({
        store_id: body.store_id,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_email: body.customer_email,
        items: body.items,
        total: body.total,
        notes: body.notes,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Send vendor notification email (non-blocking)
    if (store.email) {
      sendOrderNotification({
        storeEmail: store.email,
        storeName: store.name,
        orderId: order.id,
        customerName: body.customer_name,
        customerPhone: body.customer_phone,
        items: body.items,
        total: body.total,
        notes: body.notes,
      }).catch(() => {});
    }

    return addRateLimitHeaders(NextResponse.json(order, { status: 201 }), rl.headers);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
