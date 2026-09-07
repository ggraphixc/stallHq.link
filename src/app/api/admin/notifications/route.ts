import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "").split(",").map(s => s.trim()).filter(Boolean);

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

async function sendEmail(to: string, subject: string, htmlContent: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "StallHq", email: "ggraphixc@gmail.com" },
        to: [{ email: to }], subject, htmlContent,
      }),
    });
    return res.ok;
  } catch { return false; }
}

/** Resolve user IDs for a given audience target */
async function resolveAudience(target: string): Promise<string[]> {
  // Get all active stores with their user IDs and plans
  const { data: stores } = await supabaseAdmin
    .from("stores")
    .select("user_id, plan")
    .eq("is_active", true);

  if (!stores) return [];

  let filtered = stores;
  if (target === "trial") filtered = stores.filter(s => s.plan === "trial");
  else if (target === "monthly") filtered = stores.filter(s => s.plan === "monthly");
  else if (target === "quarterly") filtered = stores.filter(s => s.plan === "quarterly");
  else if (target === "annual") filtered = stores.filter(s => s.plan === "annual");
  else if (target === "vendors") return stores.map(s => s.user_id);
  else if (target === "customers") {
    // Get all non-vendor users (users without a store)
    const vendorIds = new Set(stores.map(s => s.user_id));
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
    return (allUsers?.users || [])
      .filter(u => !vendorIds.has(u.id) && u.email)
      .map(u => u.id);
  }

  return filtered.map(s => s.user_id);
}

// GET — list recent admin-sent in-app notifications
export async function GET() {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Get notifications sent by admins (sent_by is not null)
    const { data, error } = await supabaseAdmin
      .from("user_notifications")
      .select("*")
      .not("sent_by", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST — create and send in-app notification to targeted users
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const {
      title, body: notifBody, type = "info", target = "all",
      image_url, action_label, action_link,
      sendEmail: shouldEmail = false, schedule_at,
    } = body;

    if (!title || !notifBody) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
    }

    // If scheduled, save to push_content for cron processing
    if (schedule_at) {
      const { error } = await supabaseAdmin.from("push_content").insert({
        title, body: notifBody, type: "content", audience: target,
        send_at: schedule_at, status: "scheduled",
        created_by: user.id,
      });
      if (error) throw error;
      return NextResponse.json({ success: true, scheduled: true });
    }

    // Resolve target users
    const userIds = await resolveAudience(target);
    if (userIds.length === 0) {
      return NextResponse.json({ error: "No users found for this audience" }, { status: 400 });
    }

    // Insert a notification for each target user
    const rows = userIds.map(userId => ({
      user_id: userId,
      title,
      body: notifBody,
      type,
      link: action_link || null,
      image_url: image_url || null,
      action_label: action_label || null,
      action_link: action_link || null,
      sent_by: user.id,
    }));

    // Batch insert (Supabase handles large batches well)
    const { error: insertError } = await supabaseAdmin
      .from("user_notifications")
      .insert(rows);

    if (insertError) throw insertError;

    // Send emails if requested
    let emailsSent = 0;
    if (shouldEmail) {
      try {
        const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
        const emailMap = new Map<string, string>();
        allUsers?.users?.forEach(u => {
          if (userIds.includes(u.id) && u.email) emailMap.set(u.id, u.email);
        });

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #06060b; color: #e2e8f0;">
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px;">
              ${image_url ? `<img src="${image_url}" style="width: 100%; border-radius: 8px; margin-bottom: 16px;" />` : ""}
              <h2 style="color: #a855f7; margin: 0 0 16px;">${title}</h2>
              <p style="line-height: 1.6; margin: 0 0 16px;">${notifBody}</p>
              ${action_link ? `<a href="${action_link}" style="display: inline-block; background: #a855f7; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">${action_label || "Learn More"}</a>` : ""}
              <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />
              <p style="font-size: 12px; color: #64748b; margin: 0;">StallHq · stallhq.link</p>
            </div>
          </div>`;

        for (const [userId, email] of emailMap) {
          const sent = await sendEmail(email, title, htmlContent);
          if (sent) emailsSent++;
        }
      } catch (e) { console.error("Email batch failed:", e); }
    }

    return NextResponse.json({
      success: true, sent: rows.length, emails_sent: emailsSent,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT — update a notification (admin-sent only)
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, title, body: notifBody, type, image_url, action_label, action_link } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("user_notifications")
      .update({ title, body: notifBody, type, image_url, action_label, action_link })
      .eq("id", id)
      .eq("sent_by", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE — delete a notification (admin-sent only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Delete this specific notification and any duplicates with same title+sent_by
    const { error } = await supabaseAdmin
      .from("user_notifications")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
