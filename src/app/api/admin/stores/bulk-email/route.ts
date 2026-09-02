import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "").split(",").map(s => s.trim()).filter(Boolean);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";

async function verifyAdmin() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

async function sendBrevoEmail({ to, subject, htmlContent, tags }: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  tags?: string[];
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY not configured");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL || "noreply@hqlink.vercel.app",
        name: process.env.BREVO_SENDER_NAME || "stallHq",
      },
      to,
      subject,
      htmlContent,
      tags: tags || ["admin-bulk-email"],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[BulkEmail] Brevo error:", err);
    throw new Error(`Email send failed: ${res.status}`);
  }

  const result = await res.json();
  const brevoMessageId = result.messageId?.replace(/[<>]/g, "") || null;
  return { messageId: brevoMessageId };
}

// POST /api/admin/stores/bulk-email — send email to multiple stores
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { storeIds, subject, message, type } = body;

    if (!storeIds?.length || !subject || !message) {
      return NextResponse.json({ error: "storeIds, subject, and message are required" }, { status: 400 });
    }

    if (storeIds.length > 100) {
      return NextResponse.json({ error: "Maximum 100 stores per bulk email" }, { status: 400 });
    }

    // Fetch all stores with user_id
    const { data: stores } = await supabaseAdmin
      .from("stores")
      .select("id, name, slug, email, user_id")
      .in("id", storeIds);

    if (!stores?.length) {
      return NextResponse.json({ error: "No stores found" }, { status: 404 });
    }

    // Resolve emails for each store
    const recipients: { email: string; storeId: string; storeName: string }[] = [];

    for (const store of stores) {
      let email = store.email;
      if (!email && store.user_id) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(store.user_id);
        email = userData?.user?.email;
      }
      if (email) {
        recipients.push({ email, storeId: store.id, storeName: store.name || "Vendor" });
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No vendors with email addresses found" }, { status: 400 });
    }

    // Build HTML
    const typeColors: Record<string, { bg: string; border: string; label: string; icon: string }> = {
      reminder: { bg: "rgba(168,133,247,0.08)", border: "rgba(168,133,247,0.3)", label: "Reminder", icon: "📋" },
      warning: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", label: "Warning", icon: "⚠️" },
      info: { bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.3)", label: "Information", icon: "ℹ️" },
      promotion: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)", label: "Promotion", icon: "🎉" },
      custom: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", label: "Message", icon: "✉️" },
    };
    const typeStyle = typeColors[type] || typeColors.custom;

    const messageHtml = message
      .split("\n")
      .map((line: string) => `<p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;color:#e2e8f0;">${line || "&nbsp;"}</p>`)
      .join("");

    // Send in batches of 10 (Brevo bulk limit per request)
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += 10) {
      const batch = recipients.slice(i, i + 10);

      try {
        // Brevo supports batch sending with multiple `to` entries
        const result = await sendBrevoEmail({
          to: batch.map(r => ({ email: r.email, name: r.storeName })),
          subject: `[stallHq] ${subject}`,
          htmlContent: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 4px 0;">stallHq</h1>
      <p style="font-size:12px;color:#64748b;margin:0;">Platform Announcement</p>
    </div>
    <div style="text-align:center;margin-bottom:20px;">
      <span style="display:inline-block;padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:600;background:${typeStyle.bg};border:1px solid ${typeStyle.border};color:#e2e8f0;">
        ${typeStyle.icon} ${typeStyle.label}
      </span>
    </div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin-bottom:24px;">
      <h2 style="font-size:16px;font-weight:600;color:#fff;margin:0 0 16px 0;">${subject}</h2>
      ${messageHtml}
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${APP_URL}/dashboard" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;">Go to Dashboard</a>
    </div>
    <div style="text-align:center;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;">
      <p style="font-size:11px;color:#475569;margin:0;">
        This message was sent by the stallHq admin team.<br>
        <a href="${APP_URL}/email-preferences" style="color:#64748b;">Email Preferences</a> · 
        <a href="${APP_URL}/unsubscribe" style="color:#64748b;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body></html>`,
          tags: ["admin-bulk-email", type || "custom"],
        });

        sent += batch.length;

        // Log each recipient
        for (const r of batch) {
          await supabaseAdmin.from("email_logs").insert({
            store_id: r.storeId,
            recipient_email: r.email,
            subject,
            message,
            type: type || "custom",
            status: "sent",
            brevo_message_id: result.messageId,
            sent_by: admin.id,
            metadata: JSON.stringify({ bulk: true }),
          });
        }
      } catch (err) {
        console.error(`[BulkEmail] Batch ${i / 10 + 1} failed:`, err);
        failed += batch.length;
      }
    }



    // Log summary
    await supabaseAdmin.from("admin_notifications").insert({
      type: "bulk_email_sent",
      title: `Bulk email sent: ${sent} succeeded, ${failed} failed`,
      message: `Subject: ${subject}`,
      metadata: JSON.stringify({ store_count: recipients.length, sent, failed, type }),
    });

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: recipients.length,
      skipped: stores.length - recipients.length,
    });
  } catch (error) {
    console.error("[BulkEmail] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send bulk email" },
      { status: 500 }
    );
  }
}
