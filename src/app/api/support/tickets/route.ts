import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendSupportTicketCreated } from "@/lib/email";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdmin(userId: string | undefined): boolean {
  if (!userId) return false;
  const adminIds = (process.env.ADMIN_USER_ID || "").split(",").map(s => s.trim()).filter(Boolean);
  return adminIds.length > 0 && adminIds.includes(userId);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const is_admin = searchParams.get("admin") === "true";
    const userIsAdmin = isAdmin(user.id);

    // Admin: use service role to bypass RLS; Vendor: use auth client with user_id filter
    const client = is_admin && userIsAdmin ? supabaseAdmin : supabase;

    let query = client
      .from("support_tickets")
      .select("*, store:stores(name, slug)")
      .order("created_at", { ascending: false });

    if (!is_admin || !userIsAdmin) {
      query = query.eq("user_id", user.id);
    }

    const { data: tickets, error } = await query;
    if (error) throw error;
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { subject, category, priority, message, store_id } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const VALID_CATEGORIES = ["general", "technical", "billing", "bug_report", "feature_request"];
    const VALID_PRIORITIES = ["low", "normal", "high", "urgent"];
    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        store_id: store_id || null,
        subject,
        category: category || "general",
        priority: priority || "normal",
        status: "open",
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Create first message
    const { error: msgError } = await supabase
      .from("support_messages")
      .insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_role: "vendor",
        message,
      });

    if (msgError) throw msgError;

    // Send email notification to admin (non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL || "ggraphixc@gmail.com";
    sendSupportTicketCreated({
      adminEmail,
      vendorEmail: user.email || "",
      ticketId: ticket.id,
      subject,
      category: category || "general",
    }).catch(() => {});

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
