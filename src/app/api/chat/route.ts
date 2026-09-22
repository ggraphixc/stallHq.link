import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/chat — list conversations for the current user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { conversationId, storeId, content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    let convId = conversationId;

    // Create new conversation
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

    return NextResponse.json({ message: msg, conversationId: convId });
  } catch (err) {
    console.error("[chat] POST error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
