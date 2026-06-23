import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "").split(",").map(s => s.trim()).filter(Boolean);

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

export async function GET() {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Use service role to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("admin_notifications")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();

    // Use service role to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("admin_notifications")
      .insert({ ...body, sent_by: user.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
