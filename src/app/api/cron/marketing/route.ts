import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendTrialNurtureDay1,
  sendTrialNurtureDay3,
  sendTrialNurtureDay5,
  sendWinBackEmail,
  sendWeeklyDigest,
} from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { trial_nurture: 0, win_back: 0, weekly_digest: 0, errors: 0 };
  const now = new Date();

  // ─── Trial Nurture Sequence ──────────────────────────────────────────────
  const { data: trialUsers } = await supabase
    .from("stores")
    .select("id, user_id, name, slug, created_at, plan")
    .eq("plan", "trial")
    .not("setup_complete", "is", null);

  if (trialUsers) {
    // Batch user email lookups to avoid N+1
    const userIds = [...new Set(trialUsers.map((s) => s.user_id).filter(Boolean))] as string[];
    const userMap = new Map<string, { email: string; name?: string }>();

    // Batch fetch in chunks of 100
    for (let i = 0; i < userIds.length; i += 100) {
      const chunk = userIds.slice(i, i + 100);
      const results = await Promise.allSettled(
        chunk.map(async (uid) => {
          const { data } = await supabase.auth.admin.getUserById(uid);
          if (data?.user?.email) {
            return { uid, email: data.user.email, name: data.user.user_metadata?.name };
          }
          return null;
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          userMap.set(r.value.uid, { email: r.value.email, name: r.value.name });
        }
      }
    }

    // Batch fetch product counts
    const storeIds = trialUsers.map((s) => s.id);
    const productCountMap = new Map<string, number>();

    if (storeIds.length > 0) {
      const { data: productCounts } = await supabase
        .from("products")
        .select("store_id")
        .in("store_id", storeIds);

      if (productCounts) {
        for (const row of productCounts) {
          productCountMap.set(row.store_id, (productCountMap.get(row.store_id) || 0) + 1);
        }
      }
    }

    for (const store of trialUsers) {
      if (!store.user_id) continue;
      const userInfo = userMap.get(store.user_id);
      if (!userInfo?.email) continue;

      const createdAt = new Date(store.created_at);
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      const baseArgs = {
        email: userInfo.email,
        name: userInfo.name,
        storeName: store.name,
        storeSlug: store.slug,
      };

      const productCount = productCountMap.get(store.id) || 0;

      try {
        if (daysSinceSignup === 1) {
          await sendTrialNurtureDay1(baseArgs);
          results.trial_nurture++;
        }

        if (daysSinceSignup === 3) {
          await sendTrialNurtureDay3({ ...baseArgs, productCount });
          results.trial_nurture++;
        }

        if (daysSinceSignup === 5) {
          const daysLeft = 7 - daysSinceSignup;
          await sendTrialNurtureDay5({ ...baseArgs, storeSlug: store.slug, daysLeft });
          results.trial_nurture++;
        }
      } catch {
        results.errors++;
      }
    }
  }

  // ─── Win-Back Sequence ───────────────────────────────────────────────────
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const { data: expiredStores } = await supabase
    .from("stores")
    .select("id, user_id, name, slug, subscription_expires_at")
    .not("subscription_expires_at", "is", null)
    .lt("subscription_expires_at", sevenDaysAgo.toISOString())
    .gt("subscription_expires_at", fourteenDaysAgo.toISOString());

  if (expiredStores) {
    const expiredUserIds = [...new Set(expiredStores.map((s) => s.user_id).filter(Boolean))] as string[];
    const expiredUserMap = new Map<string, { email: string; name?: string }>();

    for (let i = 0; i < expiredUserIds.length; i += 100) {
      const chunk = expiredUserIds.slice(i, i + 100);
      const batchResults = await Promise.allSettled(
        chunk.map(async (uid) => {
          const { data } = await supabase.auth.admin.getUserById(uid);
          if (data?.user?.email) {
            return { uid, email: data.user.email, name: data.user.user_metadata?.name };
          }
          return null;
        })
      );
      for (const r of batchResults) {
        if (r.status === "fulfilled" && r.value) {
          expiredUserMap.set(r.value.uid, { email: r.value.email, name: r.value.name });
        }
      }
    }

    for (const store of expiredStores) {
      if (!store.user_id) continue;
      const userInfo = expiredUserMap.get(store.user_id);
      if (!userInfo?.email) continue;

      const expiresAt = new Date(store.subscription_expires_at);
      const daysSinceExpiry = Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24));

      try {
        await sendWinBackEmail({
          email: userInfo.email,
          name: userInfo.name,
          storeName: store.name,
          storeSlug: store.slug,
          daysSinceExpiry,
        });
        results.win_back++;
      } catch {
        results.errors++;
      }
    }
  }

  // ─── Weekly Digest ───────────────────────────────────────────────────────
  // Run weekly on Mondays (or every 7th day approximation — check day of week)
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
  if (dayOfWeek === 1) {
    // Monday — send weekly digest to all active paid stores
    const { data: activeStores } = await supabase
      .from("stores")
      .select("id, user_id, name, slug, plan")
      .neq("plan", "trial")
      .not("setup_complete", "is", null);

    if (activeStores) {
      const activeUserIds = [...new Set(activeStores.map((s) => s.user_id).filter(Boolean))] as string[];
      const activeUserMap = new Map<string, { email: string; name?: string }>();

      for (let i = 0; i < activeUserIds.length; i += 100) {
        const chunk = activeUserIds.slice(i, i + 100);
        const batchResults = await Promise.allSettled(
          chunk.map(async (uid) => {
            const { data } = await supabase.auth.admin.getUserById(uid);
            if (data?.user?.email) {
              return { uid, email: data.user.email, name: data.user.user_metadata?.name };
            }
            return null;
          })
        );
        for (const r of batchResults) {
          if (r.status === "fulfilled" && r.value) {
            activeUserMap.set(r.value.uid, { email: r.value.email, name: r.value.name });
          }
        }
      }

      // Calculate date range for last 7 days
      const sevenDaysAgoISO = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      for (const store of activeStores) {
        if (!store.user_id) continue;
        const userInfo = activeUserMap.get(store.user_id);
        if (!userInfo?.email) continue;

        try {
          // Get analytics for last 7 days
          const { data: analyticsData } = await supabase
            .from("analytics")
            .select("event_type, product_id")
            .eq("store_id", store.id)
            .gte("created_at", sevenDaysAgoISO);

          const visits = analyticsData?.filter((e) => e.event_type === "visit").length || 0;
          const whatsappClicks = analyticsData?.filter((e) => e.event_type === "whatsapp_click").length || 0;

          // Get orders for last 7 days
          const { count: orderCount } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("store_id", store.id)
            .gte("created_at", sevenDaysAgoISO);

          // Get top product
          const productViews = analyticsData?.filter((e) => e.event_type === "product_view" && e.product_id) || [];
          const viewCounts = new Map<string, number>();
          for (const pv of productViews) {
            viewCounts.set(pv.product_id!, (viewCounts.get(pv.product_id!) || 0) + 1);
          }
          let topProduct: string | undefined;
          if (viewCounts.size > 0) {
            const topId = [...viewCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
            const { data: product } = await supabase
              .from("products")
              .select("name")
              .eq("id", topId)
              .single();
            topProduct = product?.name;
          }

          // Only send if there was any activity
          if (visits > 0 || (orderCount || 0) > 0 || whatsappClicks > 0) {
            await sendWeeklyDigest({
              email: userInfo.email,
              name: userInfo.name,
              storeName: store.name,
              storeSlug: store.slug,
              stats: {
                visits,
                orders: orderCount || 0,
                whatsappClicks,
                topProduct,
              },
            });
            results.weekly_digest++;
          }
        } catch {
          results.errors++;
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
    timestamp: now.toISOString(),
  });
}
