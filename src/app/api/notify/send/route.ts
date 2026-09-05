import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";

// Send push notification to users
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authSupabase = await createAuthClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin
    const adminId = process.env.ADMIN_USER_ID;
    if (user.id !== adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: notifBody, type, target, userIds, sendEmail } = body;

    if (!title || !notifBody) {
      return NextResponse.json({ error: "title and body required" }, { status: 400 });
    }

    // 1. Save to user_notifications for in-app display
    let targetUserIds: string[] = [];

    if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      // Fetch users by target plan
      let query = supabase.from("stores").select("user_id");
      if (target && target !== "all") {
        query = query.eq("plan", target);
      }
      const { data: stores } = await query;
      targetUserIds = stores?.map((s: any) => s.user_id).filter(Boolean) || [];
    }

    // Insert in-app notifications
    if (targetUserIds.length > 0) {
      const notifications = targetUserIds.map((uid) => ({
        user_id: uid,
        title,
        body: notifBody,
        type: type || "info",
        read: false,
      }));

      // Batch insert (500 at a time)
      for (let i = 0; i < notifications.length; i += 500) {
        const batch = notifications.slice(i, i + 500);
        await supabase.from("user_notifications").insert(batch);
      }
    }

    // 2. Send push notifications to subscribed users
    const { data: subscriptions } = await supabase
      .from("push_tokens")
      .select("token, platform")
      .in("user_id", targetUserIds);

    let pushSent = 0;
    if (subscriptions && subscriptions.length > 0) {
      // Send via Expo push notification service
      const expoPushTokens = subscriptions
        .filter((s: any) => s.platform !== "web")
        .map((s: any) => s.token);

      if (expoPushTokens.length > 0) {
        const chunks: string[][] = [];
        for (let i = 0; i < expoPushTokens.length; i += 100) {
          chunks.push(expoPushTokens.slice(i, i + 100));
        }

        for (const chunk of chunks) {
          try {
            const messages = chunk.map((token) => ({
              to: token,
              sound: "default",
              title,
              body: notifBody,
              data: { type },
            }));

            const res = await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(messages),
            });

            if (res.ok) {
              const data = await res.json();
              pushSent += data.data?.filter((r: any) => r.status === "ok").length || 0;
            }
          } catch (err) {
            console.error("Push send error:", err);
          }
        }
      }
    }

    // 3. Optionally send emails
    let emailsSent = 0;
    if (sendEmail) {
      const brevoKey = process.env.BREVO_API_KEY;
      if (brevoKey) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const targetSet = new Set(targetUserIds);
        const recipients = users?.users?.filter((u: any) => targetSet.has(u.id)) || [];

        for (const u of recipients) {
          try {
            await fetch("https://api.brevo.com/v3/smtp/email", {
              method: "POST",
              headers: {
                "api-key": brevoKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sender: { name: "stallHq", email: process.env.BREVO_SENDER_EMAIL || "noreply@hqlink.vercel.app" },
                to: [{ email: u.email }],
                subject: title,
                htmlContent: `<p>${notifBody}</p>`,
              }),
            });
            emailsSent++;
          } catch {}
        }
      }
    }

    return NextResponse.json({
      success: true,
      users: targetUserIds.length,
      pushSent,
      emailsSent,
    });
  } catch (error) {
    console.error("Notification send error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}

// GET: list sent notifications
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("user_notifications")
      .select("id, title, body, type, read, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    // Deduplicate by title (since each user gets their own row)
    const seen = new Map<string, any>();
    data?.forEach((n: any) => {
      if (!seen.has(n.title)) {
        seen.set(n.title, { ...n, recipientCount: 1 });
      } else {
        seen.get(n.title).recipientCount++;
      }
    });

    return NextResponse.json(Array.from(seen.values()));
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
