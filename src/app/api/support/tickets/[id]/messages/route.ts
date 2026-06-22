import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { sendSupportReplyNotification } from "@/lib/email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { message, sender_role } = body;

    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const { data: msg, error } = await supabase
      .from("support_messages")
      .insert({
        ticket_id: id,
        sender_id: user.id,
        sender_role: sender_role || "vendor",
        message,
      })
      .select()
      .single();

    if (error) throw error;

    // Update ticket status
    await supabase
      .from("support_tickets")
      .update({ status: sender_role === "admin" ? "replied" : "open", updated_at: new Date().toISOString() })
      .eq("id", id);

    // Send email notification for admin replies (non-blocking)
    if (sender_role === "admin") {
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("subject, user_id")
        .eq("id", id)
        .single();

      if (ticket) {
        const { data: vendor } = await supabase.auth.admin.getUserById(ticket.user_id);
        if (vendor?.user?.email) {
          sendSupportReplyNotification({
            vendorEmail: vendor.user.email,
            ticketId: id,
            subject: ticket.subject,
            replyPreview: message,
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
