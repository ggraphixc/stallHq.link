import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendTrialNurtureDay1,
  sendTrialNurtureDay3,
  sendTrialNurtureDay5,
  sendTrialNurtureDay7,
  sendTrialNurtureDay10,
  sendWinBackEmail,
  sendWeeklyDigest,
  sendWeeklyAnalyticsSummary,
} from "@/lib/email";
import { postPromo, buildCaption, type SocialStore, type SocialProduct } from "@/lib/social-post";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  // Verify cron secret — accept Bearer token OR Vercel's x-vercel-cron header
  const authHeader = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !vercelCron) {
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

        if (daysSinceSignup === 7) {
          await sendTrialNurtureDay7(baseArgs);
          results.trial_nurture++;
        }

        if (daysSinceSignup === 10) {
          const daysLeft = 14 - daysSinceSignup;
          await sendTrialNurtureDay10({ ...baseArgs, storeSlug: store.slug, daysLeft });
          results.trial_nurture++;
        }

        if (daysSinceSignup === 12) {
          const daysLeft = 14 - daysSinceSignup;
          await sendTrialNurtureDay5({ ...baseArgs, storeSlug: store.slug, daysLeft });
          results.trial_nurture++;
        }

        if (daysSinceSignup === 13) {
          const daysLeft = 14 - daysSinceSignup;
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
          // Use aggregated data instead of raw analytics (much faster)
          const sevenDaysAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            .toISOString().split("T")[0];

          const { data: aggData } = await supabase
            .from("analytics_aggregates")
            .select("visits, whatsapp_clicks, product_views")
            .eq("store_id", store.id)
            .gte("date", sevenDaysAgoDate);

          let visits = 0;
          let whatsappClicks = 0;
          if (aggData) {
            for (const row of aggData) {
              visits += row.visits || 0;
              whatsappClicks += row.whatsapp_clicks || 0;
            }
          }

          // Get orders for last 7 days
          const { count: orderCount } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("store_id", store.id)
            .gte("created_at", sevenDaysAgoISO);

          // Get top product from raw analytics (still needed for product-level detail)
          const { data: topProductData } = await supabase
            .from("analytics")
            .select("product_id")
            .eq("store_id", store.id)
            .eq("event_type", "product_view")
            .gte("created_at", sevenDaysAgoISO)
            .not("product_id", "is", null)
            .limit(100);

          let topProduct: string | undefined;
          if (topProductData && topProductData.length > 0) {
            const viewCounts = new Map<string, number>();
            for (const pv of topProductData) {
              viewCounts.set(pv.product_id, (viewCounts.get(pv.product_id) || 0) + 1);
            }
            const topId = [...viewCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
            const { data: product } = await supabase
              .from("products")
              .select("name")
              .eq("id", topId)
              .single();
            topProduct = product?.name;
          }

          // Calculate growth metrics from aggregated data
          const lastWeekDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
            .toISOString().split("T")[0];
          const thisWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            .toISOString().split("T")[0];

          const { data: lastWeekAgg } = await supabase
            .from("analytics_aggregates")
            .select("visits, whatsapp_clicks")
            .eq("store_id", store.id)
            .gte("date", lastWeekDate)
            .lt("date", thisWeekDate);

          let lastWeekVisits = 0;
          let lastWeekClicks = 0;
          if (lastWeekAgg) {
            for (const row of lastWeekAgg) {
              lastWeekVisits += row.visits || 0;
              lastWeekClicks += row.whatsapp_clicks || 0;
            }
          }

          const calcTrend = (current: number, previous: number): number | undefined => {
            if (previous === 0) return current > 0 ? 100 : undefined;
            return Math.round(((current - previous) / previous) * 100);
          };

          // Calculate best/worst day of week
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const dayTotals: Record<number, { visits: number; count: number }> = {};
          const { data: weekDaily } = await supabase
            .from("analytics_aggregates")
            .select("date, visits")
            .eq("store_id", store.id)
            .gte("date", thisWeekDate);

          if (weekDaily) {
            for (const row of weekDaily) {
              const dow = new Date(row.date).getDay();
              if (!dayTotals[dow]) dayTotals[dow] = { visits: 0, count: 0 };
              dayTotals[dow].visits += row.visits || 0;
              dayTotals[dow].count++;
            }
          }

          const dayOfWeekArr = dayNames.map((name, i) => {
            const t = dayTotals[i];
            if (!t || t.count === 0) return { day: name, avgVisits: 0 };
            return { day: name, avgVisits: Math.round(t.visits / t.count) };
          });

          const sortedDays = [...dayOfWeekArr].filter((d) => d.avgVisits > 0).sort((a, b) => b.avgVisits - a.avgVisits);
          const bestDay = sortedDays[0] || null;
          const worstDay = sortedDays.length > 1 ? sortedDays[sortedDays.length - 1] : null;

          // Build top products list
          const topProductsList: Array<{ name: string; count: number }> = [];
          if (topProductData && topProductData.length > 0) {
            const viewCounts = new Map<string, number>();
            for (const pv of topProductData) {
              viewCounts.set(pv.product_id, (viewCounts.get(pv.product_id) || 0) + 1);
            }
            const sorted = [...viewCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
            for (const [id, count] of sorted) {
              const { data: prod } = await supabase
                .from("products")
                .select("name")
                .eq("id", id)
                .single();
              if (prod?.name) topProductsList.push({ name: prod.name, count });
            }
          }

          const conversionRate = visits > 0 ? ((whatsappClicks / visits) * 100).toFixed(1) : "0";

          // Only send if there was any activity
          if (visits > 0 || (orderCount || 0) > 0 || whatsappClicks > 0) {
            await sendWeeklyAnalyticsSummary({
              email: userInfo.email,
              name: userInfo.name,
              storeName: store.name,
              storeSlug: store.slug,
              stats: {
                visits,
                clicks: whatsappClicks,
                orders: orderCount || 0,
                conversionRate,
                weekOverWeek: {
                  visits: { current: visits, previous: lastWeekVisits, trend: calcTrend(visits, lastWeekVisits) },
                  clicks: { current: whatsappClicks, previous: lastWeekClicks, trend: calcTrend(whatsappClicks, lastWeekClicks) },
                },
                bestDay,
                worstDay,
                topProducts: topProductsList.length > 0 ? topProductsList : undefined,
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

  // ─── Scheduled Promo Posts ─────────────────────────────────────────────
  const { data: duePosts } = await supabase
    .from("scheduled_promo_posts")
    .select(`
      id,
      platform,
      stores (id, name, slug, whatsapp_number, instagram_handle),
      products (id, name, image_url, price)
    `)
    .eq("status", "pending")
    .lte("scheduled_at", now.toISOString());

  let scheduled_posted = 0;
  let scheduled_failed = 0;

  if (duePosts && duePosts.length > 0) {
    for (const post of duePosts) {
      const store = (Array.isArray(post.stores) ? post.stores[0] : post.stores) as SocialStore | null;
      const product = (Array.isArray(post.products) ? post.products[0] : post.products) as SocialProduct | null;
      if (!store || !product) {
        await supabase
          .from("scheduled_promo_posts")
          .update({ status: "failed", error: "Store or product not found" })
          .eq("id", post.id);
        scheduled_failed++;
        continue;
      }

      try {
        const caption = buildCaption(product, store);
        const postResult = await postPromo({
          platform: post.platform as "whatsapp" | "instagram",
          store,
          product,
          caption,
        });

        await supabase
          .from("scheduled_promo_posts")
          .update({
            status: postResult.success ? "posted" : "failed",
            error: postResult.success ? null : postResult.error || null,
            posted_at: postResult.success ? now.toISOString() : null,
          })
          .eq("id", post.id);

        if (postResult.success) scheduled_posted++;
        else scheduled_failed++;
      } catch {
        await supabase
          .from("scheduled_promo_posts")
          .update({ status: "failed", error: "Posting exception" })
          .eq("id", post.id);
        scheduled_failed++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
    scheduled_posted,
    scheduled_failed,
    timestamp: now.toISOString(),
  });
}
