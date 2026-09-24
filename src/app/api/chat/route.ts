import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendPushToUsers } from "@/lib/push";

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resolveUser(req: NextRequest): Promise<{ id: string; email?: string | null; user_metadata?: Record<string, unknown> | null } | null> {
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
      const [convResult, msgResult] = await Promise.all([
        admin
          .from("conversations")
          .select("*, store:stores(id, name, slug, logo_url)")
          .eq("id", conversationId)
          .single(),
        admin
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true }),
      ]);

      const { data: conv, error: convErr } = convResult;
      if (convErr || !conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Only participants can view
      if (conv.customer_id !== user.id && conv.vendor_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { data: messages, error: msgErr } = msgResult;
      if (msgErr) throw msgErr;

      // Mark as read for the current user
      if (conv.customer_id === user.id && conv.unread_customer > 0) {
        await Promise.all([
          admin.from("conversations").update({ unread_customer: 0 }).eq("id", conversationId),
          admin
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("conversation_id", conversationId)
            .is("read_at", null)
            .neq("sender_id", user.id),
        ]);
      } else if (conv.vendor_id === user.id && conv.unread_vendor > 0) {
        await Promise.all([
          admin.from("conversations").update({ unread_vendor: 0 }).eq("id", conversationId),
          admin
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("conversation_id", conversationId)
            .is("read_at", null)
            .neq("sender_id", user.id),
        ]);
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
    const adminIds = (process.env.ADMIN_USER_ID || "")
      .split(",").map((s) => s.trim()).filter(Boolean);
    const isAdmin = adminIds.includes(user.id);

    if (isAdmin) {
      // Admin sees all conversations
    } else if (vendorId && vendorId === user.id) {
      query = query.eq("vendor_id", vendorId);
    } else if (customerId && customerId === user.id) {
      query = query.eq("customer_id", customerId);
    } else {
      query = query.or(`customer_id.eq.${user.id},vendor_id.eq.${user.id}`);
    }

    const { data: convs, error } = await query;
    if (error) throw error;

    // Attach customer info for vendor view (deduped, parallel lookups)
    const rows = convs || [];
    const customerIds = new Set<string>();
    for (const c of rows) {
      if (c.customer_id !== user.id) customerIds.add(c.customer_id);
    }
    const emailById = new Map<string, string>();
    await Promise.all(
      [...customerIds].map(async (id) => {
        try {
          const { data: cust } = await admin.auth.admin.getUserById(id);
          emailById.set(id, cust?.user?.email || "Unknown");
        } catch {
          emailById.set(id, "Unknown");
        }
      })
    );
    const enriched = rows.map((c) =>
      c.customer_id === user.id ? c : { ...c, customer_email: emailById.get(c.customer_id) || "Unknown" }
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

      // Find existing conversation first (no unique constraint on
      // (customer_id, store_id), so upsert with onConflict would throw)
      const { data: existing, error: findErr } = await admin
        .from("conversations")
        .select("id")
        .eq("customer_id", user.id)
        .eq("store_id", storeId)
        .limit(1)
        .maybeSingle();

      if (findErr) throw findErr;

      let conversationId: string;
      if (existing) {
        conversationId = existing.id;
      } else {
        const { data: created, error: insertErr } = await admin
          .from("conversations")
          .insert({ customer_id: user.id, store_id: storeId, vendor_id: store.user_id })
          .select("id")
          .single();

        if (insertErr) {
          // Unique-violation race: another request inserted between our
          // select and insert — re-select the winner.
          const isUniqueViolation =
            (insertErr as { code?: string }).code === "23505" ||
            /duplicate/i.test(insertErr.message || "");
          if (isUniqueViolation) {
            const { data: raced, error: raceErr } = await admin
              .from("conversations")
              .select("id")
              .eq("customer_id", user.id)
              .eq("store_id", storeId)
              .limit(1)
              .maybeSingle();
            if (raceErr || !raced) throw raceErr || insertErr;
            conversationId = raced.id;
          } else {
            throw insertErr;
          }
        } else if (!created) {
          throw new Error("Failed to create conversation");
        } else {
          conversationId = created.id;
        }
      }

      convId = conversationId;
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

    // Fire-and-forget push to the other participant (never blocks the send)
    const otherParticipantId = isCustomerSender ? conv.vendor_id : conv.customer_id;
    if (otherParticipantId && otherParticipantId !== user.id) {
      const senderName =
        (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
        (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
        user.email ||
        "";
      void sendPushToUsers([otherParticipantId], {
        title: senderName || "New message",
        body: content.trim().slice(0, 120),
        data: { screen: "chat", conversationId: convId },
      }).catch(console.error);
    }

    return NextResponse.json({ message: msg, conversationId: convId });
  } catch (err) {
    console.error("[chat] POST error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
