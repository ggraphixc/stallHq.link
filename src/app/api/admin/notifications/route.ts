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
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "StallHq", email: "ggraphixc@gmail.com" },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from("admin_notifications")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { title, body: notifBody, type, target, sendEmail: shouldEmail = false } = body;

    // Use service role to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("admin_notifications")
      .insert({ title, body: notifBody, type, target, sent_by: user.id })
      .select()
      .single();

    if (error) throw error;

    // Send emails to targeted vendors if requested
    if (shouldEmail) {
      try {
        // Fetch vendors based on target
        const { data: stores } = await supabaseAdmin
          .from("stores")
          .select("id, user_id, plan, name")
          .eq("is_active", true);

        let targetStores = stores || [];
        if (target === "trial") targetStores = targetStores.filter(s => s.plan === "trial");
        else if (target === "monthly") targetStores = targetStores.filter(s => s.plan === "monthly");
        else if (target === "quarterly") targetStores = targetStores.filter(s => s.plan === "quarterly");
        else if (target === "annual") targetStores = targetStores.filter(s => s.plan === "annual");

        // Fetch user emails
        const userIds = targetStores.map(s => s.user_id);
        if (userIds.length > 0) {
          const { data: users } = await supabaseAdmin.auth.admin.listUsers();
          const emailMap = new Map<string, string>();
          users?.users?.forEach(u => {
            if (userIds.includes(u.id) && u.email) emailMap.set(u.id, u.email);
          });

          let emailsSent = 0;
          for (const store of targetStores) {
            const email = emailMap.get(store.user_id);
            if (!email) continue;
            const htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #06060b; color: #e2e8f0;">
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px;">
                  <h2 style="color: #a855f7; margin: 0 0 16px;">${title}</h2>
                  <p style="line-height: 1.6; margin: 0 0 16px;">${notifBody}</p>
                  <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 16px 0;" />
                  <p style="font-size: 12px; color: #64748b; margin: 0;">StallHq · stallhq.link</p>
                </div>
              </div>
            `;
            const sent = await sendEmail(email, title, htmlContent);
            if (sent) emailsSent++;
          }
          console.log(`[Notifications] Emails sent: ${emailsSent}/${targetStores.length}`);
        }
      } catch (emailError) {
        console.error("[Notifications] Email sending failed:", emailError);
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, title, body: notifBody, type, target } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("admin_notifications")
      .update({ title, body: notifBody, type, target })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("admin_notifications")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
