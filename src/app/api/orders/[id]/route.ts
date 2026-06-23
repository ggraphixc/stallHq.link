import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { sendStatusUpdateEmail } from "@/lib/email";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSupabase = await createClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `status is required and must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify user owns this order's store
    const { data: order } = await authSupabase
      .from("orders")
      .select("id, stores(user_id)")
      .eq("id", id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const storeData = Array.isArray(order.stores) ? order.stores[0] : order.stores;
    if (!storeData || storeData.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: updatedOrder, error: updateError } = await authSupabase
      .from("orders")
      .update({ status: body.status, vendor_notes: body.vendor_notes || null, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, stores(name)")
      .single();

    if (updateError) throw updateError;

    // Send customer status update email (non-blocking)
    if (updatedOrder.customer_email && updatedOrder.stores) {
      const store = updatedOrder.stores as { name: string };
      sendStatusUpdateEmail({
        customerEmail: updatedOrder.customer_email,
        storeName: store.name,
        orderId: updatedOrder.id,
        status: body.status,
        items: updatedOrder.items,
        total: updatedOrder.total,
      }).catch(() => {});
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
