import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  resolveAudienceTokens, resolveAudienceUserIds, sendPushToTokens, saveInAppNotifications,
  type PushAudience,
} from "@/lib/push";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "").split(",").map((s) => s.trim()).filter(Boolean);

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

const AUDIENCES: PushAudience[] = ["all", "customers", "vendors", "trial", "paid"];

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    const { data, error } = await supabaseAdmin
      .from("push_content")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error listing push content:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const {
      title,
      body: contentBody,
      type = "content",
      audience = "all",
      sendAt,
      sendNow = false,
      repeatCadence,
      seasonalPack,
    } = body;

    if (!title?.trim() || !contentBody?.trim()) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }
    if (!AUDIENCES.includes(audience)) {
      return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
    }

    const sendAtIso = sendAt && !sendNow ? new Date(sendAt).toISOString() : new Date().toISOString();

    const { data: content, error } = await supabaseAdmin
      .from("push_content")
      .insert({
        title: title.trim(),
        body: contentBody.trim(),
        type,
        audience,
        send_at: sendAtIso,
        status: sendNow ? "sent" : "scheduled",
        sent_at: sendNow ? new Date().toISOString() : null,
        created_by: user.id,
        repeat_cadence: repeatCadence || null,
        seasonal_pack: seasonalPack || null,
      })
      .select()
      .single();
    if (error) throw error;

    if (sendNow) {
      const tokens = await resolveAudienceTokens(audience as PushAudience);
      const sent = await sendPushToTokens(tokens, {
        title: title.trim(),
        body: contentBody.trim(),
        data: { screen: "notifications", type },
      });
      const userIds = await resolveAudienceUserIds(audience as PushAudience);
      await saveInAppNotifications(userIds, {
        title: title.trim(),
        body: contentBody.trim(),
        type,
      });
      await supabaseAdmin
        .from("push_content")
        .update({ recipients_count: sent })
        .eq("id", content.id);
      return NextResponse.json({ ...content, recipients_count: sent }, { status: 201 });
    }

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    console.error("Error creating push content:", error);
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

    const { data: existing } = await supabaseAdmin
      .from("push_content")
      .select("status")
      .eq("id", id)
      .single();
    if (existing && existing.status === "sent") {
      return NextResponse.json({ error: "Already sent" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("push_content").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting push content:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}