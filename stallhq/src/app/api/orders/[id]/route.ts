import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus, getOrderById } from "@/lib/supabase";
import { sendStatusUpdateEmail } from "@/lib/email";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    const order = await updateOrderStatus(id, body.status);

    // Send customer status update email (non-blocking)
    if (order.customer_email && order.stores) {
      const store = order.stores as { name: string };
      sendStatusUpdateEmail({
        customerEmail: order.customer_email,
        storeName: store.name,
        orderId: order.id,
        status: body.status,
        items: order.items,
        total: order.total,
      }).catch(() => {});
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
