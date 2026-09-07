import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  resolveAudienceTokens, resolveAudienceUserIds, sendPushToTokens, saveInAppNotifications,
  type PushAudience,
} from "@/lib/push";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();
    const { data: due, error } = await supabaseAdmin
      .from("push_content")
      .select("*")
      .eq("status", "scheduled")
      .lte("send_at", now)
      .limit(20);

    if (error) throw error;

    let sentCount = 0;
    let inAppCount = 0;

    for (const item of due ?? []) {
      const tokens = await resolveAudienceTokens(item.audience as PushAudience);
      const userIds = await resolveAudienceUserIds(item.audience as PushAudience);
      const sent = await sendPushToTokens(tokens, {
        title: item.title,
        body: item.body,
        data: { screen: "notifications", type: item.type },
      });
      await saveInAppNotifications(userIds, {
        title: item.title,
        body: item.body,
        type: item.type || "info",
      });
      sentCount += sent;
      inAppCount += userIds.length;

      await supabaseAdmin
        .from("push_content")
        .update({
          status: sent > 0 ? "sent" : "failed",
          sent_at: now,
          recipients_count: sent,
        })
        .eq("id", item.id);
    }

    return NextResponse.json({
      success: true,
      processed: due?.length ?? 0,
      pushSent: sentCount,
      inApp: inAppCount,
    });
  } catch (error) {
    console.error("Push daily cron failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}