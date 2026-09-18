import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  sendPushToUsers,
  saveInAppNotifications,
} from "@/lib/push";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/notifications/trigger — Smart push notification trigger.
 * Called by other API routes when an event happens (order status change, low stock, etc.)
 *
 * Body: {
 *   event: "order_status" | "low_stock" | "new_review" | "subscription_expiry" | "back_in_stock" | "price_drop",
 *   user_id: string,
 *   data: { ... event-specific payload }
 * }
 *
 * Checks notification_preferences before sending. Creates in-app notification + push.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify internal caller (CRON_SECRET or service key)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { event, user_id, data = {} } = body;

    if (!event || !user_id) {
      return NextResponse.json({ error: "event and user_id required" }, { status: 400 });
    }

    // Check notification preferences
    const { data: prefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user_id)
      .single();

    // Default to all enabled if no preferences set
    const preferences = prefs || {
      order_updates: true,
      trial_reminders: true,
      product_alerts: true,
      review_replies: true,
      marketing: false,
    };

    // Map event to preference key
    const prefMap: Record<string, keyof typeof preferences> = {
      order_status: "order_updates",
      low_stock: "product_alerts",
      back_in_stock: "product_alerts",
      price_drop: "product_alerts",
      new_review: "review_replies",
      subscription_expiry: "trial_reminders",
    };

    const prefKey = prefMap[event];
    if (prefKey && !preferences[prefKey]) {
      return NextResponse.json({ success: true, skipped: "preference_disabled" });
    }

    // Build notification content based on event
    let title = "";
    let notifBody = "";
    let link = "";

    switch (event) {
      case "order_status":
        title = "Order Update";
        notifBody = `Your order has been ${data.status || "updated"}`;
        link = data.order_id ? `/order/${data.order_id}` : "";
        break;
      case "low_stock":
        title = "Low Stock Alert";
        notifBody = `${data.product_name || "A product"} is running low (${data.stock || 0} left)`;
        link = data.product_id ? `/dashboard/products/${data.product_id}` : "/dashboard";
        break;
      case "back_in_stock":
        title = "Back in Stock!";
        notifBody = `${data.product_name || "A product"} you were interested in is back in stock`;
        link = data.product_id ? `/product/${data.product_id}` : "";
        break;
      case "price_drop":
        title = "Price Drop!";
        notifBody = `${data.product_name || "A product"} dropped from ₦${data.old_price} to ₦${data.new_price}`;
        link = data.product_id ? `/product/${data.product_id}` : "";
        break;
      case "new_review":
        title = "New Review";
        notifBody = `${data.reviewer_name || "Someone"} left a ${data.rating || ""}-star review on ${data.product_name || "your product"}`;
        link = data.store_slug ? `/${data.store_slug}` : "/dashboard";
        break;
      case "subscription_expiry":
        title = "Subscription Expiring";
        notifBody = data.days_left
          ? `Your ${data.plan || "subscription"} expires in ${data.days_left} days`
          : "Your subscription is expiring soon";
        link = "/upgrade";
        break;
      default:
        title = data.title || "Notification";
        notifBody = data.body || "You have a new notification";
        link = data.link || "";
    }

    // Save in-app notification
    await saveInAppNotifications([user_id], {
      title,
      body: notifBody,
      type: event,
      link,
    });

    // Send push notification
    await sendPushToUsers([user_id], {
      title,
      body: notifBody,
      data: { screen: "notifications", event, ...data },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[notification-trigger] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
