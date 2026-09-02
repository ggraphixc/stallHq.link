import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Brevo webhook secret for verification
const BREVO_WEBHOOK_SECRET = process.env.BREVO_WEBHOOK_SECRET;

// POST /api/webhooks/brevo — handle Brevo email event webhooks
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    if (BREVO_WEBHOOK_SECRET) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${BREVO_WEBHOOK_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const events = Array.isArray(body) ? body : [body];

    for (const event of events) {
      const eventType = event.event; // "delivered", "opened", "clicked", "bounced", "complained"
      const messageId = event["Message-Id"] || event.messageId;

      if (!messageId) continue;

      // Find matching email log by brevo_message_id
      const { data: log } = await supabaseAdmin
        .from("email_logs")
        .select("id, status")
        .eq("brevo_message_id", messageId)
        .single();

      if (!log) continue;

      const now = new Date().toISOString();
      const updates: Record<string, any> = { updated_at: now };

      switch (eventType) {
        case "delivered":
          updates.status = "delivered";
          break;
        case "opened":
          updates.status = "opened";
          updates.opened_at = now;
          updates.opened_count = (log as any).opened_count ? (log as any).opened_count + 1 : 1;
          break;
        case "clicked":
          updates.status = "clicked";
          updates.clicked_at = now;
          updates.clicked_count = (log as any).clicked_count ? (log as any).clicked_count + 1 : 1;
          break;
        case "bounced":
          updates.status = "bounced";
          break;
        case "complained":
          updates.status = "complained";
          break;
        case "sent":
          updates.status = "sent";
          break;
      }

      await supabaseAdmin
        .from("email_logs")
        .update(updates)
        .eq("id", log.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[BrevoWebhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
