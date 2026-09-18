import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendPushToUsers, saveInAppNotifications } from "@/lib/push";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Milestone definitions: { threshold, message, type }
 * Checked after each order creation or analytics update.
 */
const MILESTONES = [
  { threshold: 1, field: "order_count", title: "First Sale!", body: "Congratulations on your first order! 🎉", icon: "🎉" },
  { threshold: 10, field: "order_count", title: "10 Orders!", body: "You've reached 10 orders. Keep going! 🚀", icon: "🚀" },
  { threshold: 50, field: "order_count", title: "50 Orders!", body: "50 orders and counting. You're on fire! 🔥", icon: "🔥" },
  { threshold: 100, field: "order_count", title: "100 Orders!", body: "100 orders! You're a stallHq champion! 🏆", icon: "🏆" },
  { threshold: 500, field: "order_count", title: "500 Orders!", body: "500 orders! Incredible milestone! 💎", icon: "💎" },
  { threshold: 1000, field: "order_count", title: "1,000 Orders!", body: "1,000 orders! You're a legend! 👑", icon: "👑" },

  { threshold: 100, field: "visit_count", title: "100 Visits!", body: "Your store has been visited 100 times! 📈", icon: "📈" },
  { threshold: 500, field: "visit_count", title: "500 Visits!", body: "500 visitors to your store! 🌟", icon: "🌟" },
  { threshold: 1000, field: "visit_count", title: "1,000 Visits!", body: "1,000 visitors! Your store is taking off! 🚀", icon: "🚀" },
  { threshold: 5000, field: "visit_count", title: "5,000 Visits!", body: "5,000 visitors! Massive reach! 💥", icon: "💥" },

  { threshold: 10, field: "product_count", title: "10 Products!", body: "You've listed 10 products. Great catalog! 📦", icon: "📦" },
  { threshold: 50, field: "product_count", title: "50 Products!", body: "50 products in your store! Impressive! 🏪", icon: "🏪" },
];

interface MilestoneCheck {
  storeId: string;
  userId: string;
}

/**
 * Check and send milestone notifications for a store.
 * Call this after order creation or analytics updates.
 */
export async function checkMilestones({ storeId, userId }: MilestoneCheck): Promise<void> {
  try {
    // Get current counts
    const [ordersResult, visitsResult, productsResult] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .not("status", "eq", "cancelled"),
      supabaseAdmin
        .from("analytics")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("event_type", "visit"),
      supabaseAdmin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId),
    ]);

    const counts = {
      order_count: ordersResult.count || 0,
      visit_count: visitsResult.count || 0,
      product_count: productsResult.count || 0,
    };

    // Check each milestone
    for (const milestone of MILESTONES) {
      const currentCount = counts[milestone.field as keyof typeof counts];
      if (currentCount !== milestone.threshold) continue;

      // Check if we already sent this milestone (dedup via in-app notification)
      const { data: existing } = await supabaseAdmin
        .from("user_notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("title", milestone.title)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Send milestone notification
      await saveInAppNotifications([userId], {
        title: milestone.title,
        body: milestone.body,
        type: "milestone",
        link: "/dashboard",
      });

      await sendPushToUsers([userId], {
        title: milestone.title,
        body: milestone.body,
        data: { screen: "dashboard", milestone: milestone.title },
      });

      console.log(`[milestone] Sent: ${milestone.title} for store ${storeId}`);
    }
  } catch (error) {
    console.error("[milestone] Check error:", error);
  }
}
