import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .select("*, store:stores(name, slug), messages:support_messages(*)")
      .eq("id", id)
      .single();

    if (error || !ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    // Sort messages by created_at
    const ticketData = ticket as any;
    if (ticketData.messages) {
      ticketData.messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
