import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resolveUser(req: NextRequest): Promise<{ id: string } | null> {
  const token = req.headers.get("x-access-token");
  if (token) {
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) return data.user;
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) return data.user;
  } catch {}
  return null;
}

// GET /api/chat — list conversations for the current user
export async function GET(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("id");

    // Single conversation with messages
    if (conversationId) {
      const { data: conv, error: convErr } = await admin
        .from("conversations")
        .select("*, store:stores(id, name, slug, logo_url)")
        .eq("id", conversationId)
        .single();

      if (convErr || !conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Only participants can view
      if (conv.customer_id !== user.id && conv.vendor_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { data: messages, error: msgErr } = await admin
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (msgErr) throw msgErr;

      // Mark as read for the current user
      if (conv.customer_id === user.id && conv.unread_customer > 0) {
        await admin.from("conversations").update({ unread_customer: 0 }).eq("id", conversationId);
        await admin
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .is("read_at", null)
          .neq("sender_id", user.id);
      } else if (conv.vendor_id === user.id && conv.unread_vendor > 0) {
        await admin.from("conversations").update({ unread_vendor: 0 }).eq("id", conversationId);
        await admin
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .is("read_at", null)
          .neq("sender_id", user.id);
      }

      return NextResponse.json({ ...conv, messages: messages || [] });
    }

    // List all conversations for user
    let query = admin
      .from("conversations")
      .select("*, store:stores(id, name, slug, logo_url)")
      .order("last_message_at", { ascending: false, nullsFirst: false });

    const vendorId = searchParams.get("vendor_id");
    const customerId = searchParams.get("customer_id");

    if (user.id === (process.env.ADMIN_USER_ID || "").split(",")[0]?.trim()) {
      // Admin sees all conversations
    } else if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    } else if (customerId) {
      query = query.eq("customer_id", customerId);
    } else {
      query = query.or(`customer_id.eq.${user.id},vendor_id.eq.${user.id}`);
    }

    const { data: convs, error } = await query;
    if (error) throw error;

    // Attach customer info for vendor view
    const enriched = await Promise.all(
      (convs || []).map(async (c) => {
        if (c.customer_id === user.id) return c; // Customer already knows their own info
        const { data: cust } = await admin.auth.admin.getUserById(c.customer_id);
        return {
          ...c,
          customer_email: cust?.user?.email || "Unknown",
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("[chat] GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/chat — create conversation or send message
export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { conversationId, storeId, content } = body;

    let convId = conversationId;

    // Create/find conversation for a store (allows starting chat without first message)
    if (!convId && storeId) {
      // Get store vendor
      const { data: store, error: storeErr } = await admin
        .from("stores")
        .select("id, user_id")
        .eq("id", storeId)
        .single();

      if (storeErr || !store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

      // Upsert conversation
      const { data: conv, error: convErr } = await admin
        .from("conversations")
        .upsert(
          { customer_id: user.id, store_id: storeId, vendor_id: store.user_id },
          { onConflict: "customer_id,store_id" }
        )
        .select()
        .single();

      if (convErr) throw convErr;
      convId = conv.id;
    }

    if (!convId) {
      return NextResponse.json({ error: "conversationId or storeId required" }, { status: 400 });
    }

    // Verify participant
    const { data: conv } = await admin
      .from("conversations")
      .select("customer_id, vendor_id")
      .eq("id", convId)
      .single();

    if (!conv || (conv.customer_id !== user.id && conv.vendor_id !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Creating conversation only (no message yet) — return early
    if (!content?.trim()) {
      return NextResponse.json({ conversationId: convId, conversation: conv });
    }

    const senderRole = conv.customer_id === user.id ? "customer" : "vendor";

    // Insert message
    const { data: msg, error: msgErr } = await admin
      .from("messages")
      .insert({
        conversation_id: convId,
        sender_id: user.id,
        sender_role: senderRole,
        content: content.trim(),
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    // Bump last_message + unread for the recipient
    const isCustomerSender = conv.customer_id === user.id;
    const recipientField = isCustomerSender ? "unread_vendor" : "unread_customer";
    const { data: convFull } = await admin
      .from("conversations")
      .select("unread_customer, unread_vendor")
      .eq("id", convId)
      .single();
    const currentUnread =
      recipientField === "unread_vendor"
        ? ((convFull as { unread_vendor?: number } | null)?.unread_vendor || 0)
        : ((convFull as { unread_customer?: number } | null)?.unread_customer || 0);
    const nextUnread = currentUnread + 1;
    await admin
      .from("conversations")
      .update({
        last_message: content.trim().slice(0, 200),
        last_message_at: new Date().toISOString(),
        [recipientField]: nextUnread,
      })
      .eq("id", convId);

    return NextResponse.json({ message: msg, conversationId: convId });
  } catch (err) {
    console.error("[chat] POST error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
