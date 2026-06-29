import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Immediately post a scheduled promo post
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    // Fetch the scheduled post with store and product data
    const { data: post, error: fetchError } = await supabase
      .from("scheduled_promo_posts")
      .select(`
        *,
        stores (id, name, slug, whatsapp_number, instagram_handle),
        products (id, name, price, image_url)
      `)
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const store = post.stores as Record<string, unknown>;
    const product = post.products as Record<string, unknown>;
    const platform = post.platform as string;

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://stallhq.com"}/${store.slug}/product/${product.id}`;
    const caption = `🛍️ ${product.name}\n💰 ₦${(product.price as number).toLocaleString()}\n\nShop now on ${store.name} via StallHq\n${shareUrl}`;

    let result: { success: boolean; messageId?: string; error?: string };

    if (platform === "whatsapp") {
      result = await postToWhatsApp(
        { whatsapp_number: store.whatsapp_number as string },
        caption
      );
    } else {
      result = await postToInstagram(
        { instagram_handle: store.instagram_handle as string },
        { name: product.name as string, image_url: product.image_url as string },
        caption
      );
    }

    // Update the scheduled post status
    await supabase
      .from("scheduled_promo_posts")
      .update({
        status: result.success ? "posted" : "failed",
        error: result.error || null,
        posted_at: result.success ? new Date().toISOString() : null,
      })
      .eq("id", postId);

    // Log to promo_posts
    await supabase.from("promo_posts").insert({
      store_id: store.id,
      product_id: product.id,
      platform,
      status: result.success ? "posted" : "failed",
      message_id: result.messageId || null,
      error: result.error || null,
      caption,
      posted_at: new Date().toISOString(),
    });

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Post-now error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function postToWhatsApp(
  store: { whatsapp_number: string },
  caption: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { success: false, error: "WhatsApp Business API not configured" };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: store.whatsapp_number.replace(/\D/g, ""),
          type: "text",
          text: { body: caption },
        }),
      }
    );

    const data = await response.json();

    if (data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    }

    return { success: false, error: data.error?.message || "Failed to send" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function postToInstagram(
  store: { instagram_handle: string },
  product: { name: string; image_url?: string },
  caption: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    return { success: false, error: "Instagram Graph API not configured" };
  }

  try {
    const containerResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/media?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: product.image_url,
          caption: caption,
        }),
      }
    );

    const containerData = await containerResponse.json();

    if (!containerData.id) {
      return { success: false, error: containerData.error?.message || "Failed to create container" };
    }

    const publishResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/media_publish?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: containerData.id }),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.id) {
      return { success: true, messageId: publishData.id };
    }

    return { success: false, error: publishData.error?.message || "Failed to publish" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
