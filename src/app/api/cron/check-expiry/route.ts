import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTrialExpiryReminder, sendSubscriptionExpiryReminder } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = { trial_reminders: 0, subscription_reminders: 0, errors: 0 };

  try {
    // ── Trial reminders ──────────────────────────────────
    // Find stores on trial with expiry in 1 or 3 days
    const trialEnd3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const trialEnd1d = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString();
    const nowISO = now.toISOString();

    // Get stores expiring in 1-3 days (trial_ends_at between now and now+3d)
    const { data: trialStores, error: trialError } = await supabase
      .from("stores")
      .select("id, name, slug, user_id, trial_ends_at")
      .eq("plan", "trial")
      .gte("trial_ends_at", nowISO)
      .lte("trial_ends_at", trialEnd3d);

    if (trialError) {
      console.error("[CheckExpiry] Trial query error:", trialError);
      results.errors++;
    } else if (trialStores) {
      for (const store of trialStores) {
        if (!store.trial_ends_at) continue;
        const expiry = new Date(store.trial_ends_at);
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Only send on day 3 or day 1
        if (daysLeft !== 3 && daysLeft !== 1) continue;

        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(store.user_id);
        if (!userData?.user?.email) continue;

        const email = userData.user.email;
        const storeName = store.name || "Your Store";

        try {
          await sendTrialExpiryReminder({
            email,
            storeName,
            storeSlug: store.slug,
            daysLeft,
          });
          results.trial_reminders++;
          console.log(`[CheckExpiry] Sent trial reminder to ${email} for ${storeName} (${daysLeft}d left)`);
        } catch (err) {
          console.error(`[CheckExpiry] Failed to send trial reminder for ${store.id}:`, err);
          results.errors++;
        }
      }
    }

    // ── Subscription reminders ────────────────────────────
    // Get paid stores with expiry in 1-3 days
    const subEnd3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: subStores, error: subError } = await supabase
      .from("stores")
      .select("id, name, plan, user_id, subscription_expires_at")
      .neq("plan", "trial")
      .not("subscription_expires_at", "is", null)
      .gte("subscription_expires_at", nowISO)
      .lte("subscription_expires_at", subEnd3d);

    if (subError) {
      console.error("[CheckExpiry] Subscription query error:", subError);
      results.errors++;
    } else if (subStores) {
      for (const store of subStores) {
        if (!store.subscription_expires_at) continue;
        const expiry = new Date(store.subscription_expires_at);
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft !== 3 && daysLeft !== 1) continue;

        const { data: userData } = await supabase.auth.admin.getUserById(store.user_id);
        if (!userData?.user?.email) continue;

        try {
          await sendSubscriptionExpiryReminder({
            email: userData.user.email,
            storeName: store.name || "Your Store",
            plan: store.plan,
            daysLeft,
          });
          results.subscription_reminders++;
          console.log(`[CheckExpiry] Sent subscription reminder to ${userData.user.email} (${daysLeft}d left)`);
        } catch (err) {
          console.error(`[CheckExpiry] Failed to send sub reminder for ${store.id}:`, err);
          results.errors++;
        }
      }
    }

    console.log("[CheckExpiry] Done:", results);
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error("[CheckExpiry] Unexpected error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
