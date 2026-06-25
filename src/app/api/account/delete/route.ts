import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/api";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // 1. Verify the user is authenticated
    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // 2. Check if user is a vendor (has a store)
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id, logo_url, banner_url")
      .eq("user_id", userId)
      .single();

    // 3. If vendor, delete store-related data
    if (store) {
      // Delete products (and their images from storage)
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("id, image_url")
        .eq("store_id", store.id);

      if (products) {
        for (const product of products) {
          // Delete product images from storage
          if (product.image_url) {
            const imagePath = product.image_url.split("/products/")[1];
            if (imagePath) {
              await supabaseAdmin.storage.from("products").remove([imagePath]);
            }
          }
        }
        // Delete all products
        await supabaseAdmin.from("products").delete().eq("store_id", store.id);
      }

      // Delete store reviews
      await supabaseAdmin.from("reviews").delete().eq("store_id", store.id);

      // Delete orders (vendor's orders)
      await supabaseAdmin.from("orders").delete().eq("store_id", store.id);

      // Delete analytics
      await supabaseAdmin.from("analytics").delete().eq("store_id", store.id);

      // Delete support tickets and messages
      const { data: tickets } = await supabaseAdmin
        .from("support_tickets")
        .select("id")
        .eq("store_id", store.id);

      if (tickets) {
        for (const ticket of tickets) {
          await supabaseAdmin.from("support_messages").delete().eq("ticket_id", ticket.id);
        }
        await supabaseAdmin.from("support_tickets").delete().eq("store_id", store.id);
      }

      // Delete store images from storage
      if (store.logo_url) {
        const logoPath = store.logo_url.split("/store-logos/")[1];
        if (logoPath) {
          await supabaseAdmin.storage.from("store-logos").remove([logoPath]);
        }
      }
      if (store.banner_url) {
        const bannerPath = store.banner_url.split("/store-banners/")[1];
        if (bannerPath) {
          await supabaseAdmin.storage.from("store-banners").remove([bannerPath]);
        }
      }

      // Delete the store
      await supabaseAdmin.from("stores").delete().eq("id", store.id);
    }

    // 4. Delete customer-related data
    // Delete favorites
    await supabaseAdmin.from("favorites").delete().eq("user_id", userId);

    // Delete customer orders (as buyer)
    await supabaseAdmin.from("orders").delete().eq("customer_id", userId);

    // Delete customer support tickets
    const { data: customerTickets } = await supabaseAdmin
      .from("support_tickets")
      .select("id")
      .eq("customer_id", userId);

    if (customerTickets) {
      for (const ticket of customerTickets) {
        await supabaseAdmin.from("support_messages").delete().eq("ticket_id", ticket.id);
      }
      await supabaseAdmin.from("support_tickets").delete().eq("customer_id", userId);
    }

    // 5. Delete the user account from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    // 6. Sign out
    await authClient.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
