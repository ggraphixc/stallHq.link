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

    // Use service role for read (bypasses RLS, consistent with write)
    const { data, error } = await supabaseAdmin
      .from("platform_settings")
      .select("*");

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { settings } = body;

    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }));

    // Use service role to bypass RLS
    const { error } = await supabaseAdmin
      .from("platform_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
