import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AutoPostRequest {
  productId: string;
  storeSlug: string;
  platform: "whatsapp" | "instagram";
}

export async function POST(req: NextRequest) {
  try {
    const body: AutoPostRequest = await req.json();
    const { productId, storeSlug, platform } = body;

    if (!productId || !storeSlug || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get store
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("*")
      .eq("slug", storeSlug)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Get product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check platform credentials
    if (platform === "whatsapp" && !store.whatsapp_number) {
      return NextResponse.json({ error: "WhatsApp not connected" }, { status: 400 });
    }

    if (platform === "instagram" && !store.instagram_handle) {
      return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://stallhq.com"}/${storeSlug}/product/${productId}`;
    const caption = `*${product.name}*\n\n*N${product.price.toLocaleString()}*\n\nShop now on ${store.name} via StallHq\n${shareUrl}`;

    let result: { success: boolean; messageId?: string; error?: string };

    if (platform === "whatsapp") {
      result = await postToWhatsApp(store, product, caption, shareUrl);
    } else {
      result = await postToInstagram(store, product, caption, shareUrl);
    }

    // Log the post
    await supabase.from("promo_posts").insert({
      store_id: store.id,
      product_id: productId,
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
    console.error("Auto-post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function postToWhatsApp(
  store: { whatsapp_number: string; whatsapp_access_token?: string },
  product: { name: string; image_url?: string; price: number },
  caption: string,
  _shareUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = store.whatsapp_access_token || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { success: false, error: "WhatsApp Business API not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env" };
  }

  const toNumber = store.whatsapp_number.replace(/\D/g, "");

  // Send image message if product has image, otherwise text
  if (product.image_url) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: toNumber,
            type: "image",
            image: {
              link: product.image_url,
              caption: caption,
            },
          }),
        }
      );

      const data = await response.json();

      if (data.messages?.[0]?.id) {
        return { success: true, messageId: data.messages[0].id };
      }

      // If image fails, fall back to text
      console.warn("Image send failed, falling back to text:", data.error?.message);
    } catch (e) {
      console.warn("Image send error, falling back to text:", e);
    }
  }

  // Fallback: send text message
  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toNumber,
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
  store: { instagram_handle: string; instagram_access_token?: string },
  product: { name: string; image_url?: string },
  caption: string,
  _shareUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = store.instagram_access_token || process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    return { success: false, error: "Instagram Graph API not configured" };
  }

  try {
    // Step 1: Create media container
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

    // Step 2: Publish the container
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
