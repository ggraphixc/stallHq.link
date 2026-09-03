import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { adminClient } from "@/lib/ai";

const ADMIN_IDS = (process.env.ADMIN_USER_ID || "").split(",").map((s) => s.trim()).filter(Boolean);

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_IDS.includes(user.id)) return null;
  return user;
}

// GET /api/admin/moderation?status=pending — list flags with store info
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const status = req.nextUrl.searchParams.get("status") || "pending";
    const supabase = adminClient();

    const { data, error } = await supabase
      .from("moderation_flags")
      .select("*, stores(name, slug, whatsapp_number)")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Moderation list error:", error?.message || error);
    return NextResponse.json({ error: "Failed to load flags" }, { status: 500 });
  }
}

// PATCH /api/admin/moderation — body: { id, status: "reviewed" | "dismissed", hideProduct?: boolean }
export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, status, hideProduct } = await req.json();
    if (!id || !["reviewed", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
    }

    const supabase = adminClient();
    const { data: flag } = await supabase.from("moderation_flags").select("product_id").eq("id", id).single();
    if (!flag) return NextResponse.json({ error: "Flag not found" }, { status: 404 });

    const { error } = await supabase
      .from("moderation_flags")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    // Optionally hide the offending product from the storefront
    if (hideProduct) {
      await supabase.from("products").update({ in_stock: false }).eq("id", flag.product_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Moderation update error:", error?.message || error);
    return NextResponse.json({ error: "Failed to update flag" }, { status: 500 });
  }
}
