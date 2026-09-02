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

async function sendBrevoEmail({ to, subject, htmlContent, textContent, tags }: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
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
      textContent: textContent || subject,
      tags: tags || ["admin-email"],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[AdminEmail] Brevo error:", err);
    throw new Error(`Email send failed: ${res.status}`);
  }
  return true;
}

// POST /api/admin/stores/[id]/email — send email to a store vendor
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: storeId } = await params;
    const body = await request.json();
    const { subject, message, type } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    // Fetch store and user email
    const { data: store, error: storeError } = await supabaseAdmin
      .from("stores")
      .select("id, name, slug, email, user_id")
      .eq("id", storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Get vendor email from auth
    let vendorEmail = store.email;
    if (!vendorEmail && store.user_id) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(store.user_id);
      vendorEmail = userData?.user?.email;
    }

    if (!vendorEmail) {
      return NextResponse.json({ error: "Vendor has no email address" }, { status: 400 });
    }

    // Build HTML email
    const typeColors: Record<string, { bg: string; border: string; label: string; icon: string }> = {
      reminder: { bg: "rgba(168,133,247,0.08)", border: "rgba(168,133,247,0.3)", label: "Reminder", icon: "📋" },
      warning: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", label: "Warning", icon: "⚠️" },
      info: { bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.3)", label: "Information", icon: "ℹ️" },
      promotion: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)", label: "Promotion", icon: "🎉" },
      custom: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", label: "Message", icon: "✉️" },
    };

    const typeStyle = typeColors[type] || typeColors.custom;

    // Convert message to HTML (preserve line breaks)
    const messageHtml = message
      .split("\n")
      .map((line: string) => `<p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;color:#e2e8f0;">${line || "&nbsp;"}</p>`)
      .join("");

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 4px 0;">stallHq</h1>
      <p style="font-size:12px;color:#64748b;margin:0;">Platform Notification</p>
    </div>

    <!-- Type Badge -->
    <div style="text-align:center;margin-bottom:20px;">
      <span style="display:inline-block;padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:600;background:${typeStyle.bg};border:1px solid ${typeStyle.border};color:#e2e8f0;">
        ${typeStyle.icon} ${typeStyle.label}
      </span>
    </div>

    <!-- Message Card -->
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin-bottom:24px;">
      <h2 style="font-size:16px;font-weight:600;color:#fff;margin:0 0 16px 0;">${subject}</h2>
      ${messageHtml}
    </div>

    <!-- Store Link -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${APP_URL}/dashboard" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;">
        Go to Dashboard
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;">
      <p style="font-size:11px;color:#475569;margin:0;">
        This message was sent by the stallHq admin team.<br>
        <a href="${APP_URL}/email-preferences" style="color:#64748b;">Email Preferences</a> · 
        <a href="${APP_URL}/unsubscribe" style="color:#64748b;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    // Send email
    await sendBrevoEmail({
      to: [{ email: vendorEmail, name: store.name }],
      subject: `[stallHq] ${subject}`,
      htmlContent,
      tags: ["admin-email", type || "custom"],
    });

    // Log in admin notifications table
    await supabaseAdmin.from("admin_notifications").insert({
      type: "email_sent",
      title: `Email sent to ${store.name}`,
      message: `Subject: ${subject}`,
      metadata: JSON.stringify({ store_id: storeId, email: vendorEmail, type }),
    });

    return NextResponse.json({ success: true, sent_to: vendorEmail });
  } catch (error) {
    console.error("[AdminEmail] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
