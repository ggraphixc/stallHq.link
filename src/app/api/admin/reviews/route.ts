import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { adminClient } from "@/lib/ai";

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

// GET /api/admin/reviews?hidden=true|false — list reviews with store/product context
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const hidden = req.nextUrl.searchParams.get("hidden");
    const supabase = adminClient();

    let query = supabase
      .from("reviews")
      .select("*, stores(name, slug), products(name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (hidden === "true") query = query.eq("hidden", true);
    else if (hidden === "false") query = query.eq("hidden", false);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Admin reviews list error:", error?.message || error);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

// PATCH /api/admin/reviews — body: { id, hidden: boolean } (soft hide / unhide)
export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, hidden } = await req.json();
    if (!id || typeof hidden !== "boolean") {
      return NextResponse.json({ error: "id and hidden (boolean) required" }, { status: 400 });
    }

    const supabase = adminClient();
    const { data: existing } = await supabase.from("reviews").select("id").eq("id", id).single();
    if (!existing) return NextResponse.json({ error: "Review not found" }, { status: 404 });

    const { error } = await supabase
      .from("reviews")
      .update({ hidden, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, hidden });
  } catch (error: any) {
    console.error("Admin review update error:", error?.message || error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

// DELETE /api/admin/reviews?id=... — permanently remove a review
export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const supabase = adminClient();
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin review delete error:", error?.message || error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
