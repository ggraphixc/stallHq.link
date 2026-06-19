import { NextRequest, NextResponse } from "next/server";
import { getOrdersByStoreId, createOrder, supabase } from "@/lib/supabase";
import { sendOrderNotification } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");

    if (!storeId) {
      return NextResponse.json(
        { error: "store_id is required" },
        { status: 400 }
      );
    }

    const orders = await getOrdersByStoreId(storeId);
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
    const body = await request.json();

    const order = await createOrder({
      store_id: body.store_id,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_email: body.customer_email,
      items: body.items,
      total: body.total,
      notes: body.notes,
    });

    // Send vendor notification email (non-blocking)
    if (body.store_email) {
      sendOrderNotification({
        storeEmail: body.store_email,
        storeName: body.store_name || "Your Store",
        orderId: order.id,
        customerName: body.customer_name,
        customerPhone: body.customer_phone,
        items: body.items,
        total: body.total,
        notes: body.notes,
      }).catch(() => {});
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
