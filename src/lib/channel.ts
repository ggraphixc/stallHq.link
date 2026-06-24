import { CartItem, OrderItem } from "@/types";

// ─── WhatsApp ────────────────────────────────────────────────────────────────

export function generateWhatsAppUrl(
  whatsappNumber: string,
  storeName: string,
  items: CartItem[]
): string {
  const message = formatOrderMessage(storeName, items);
  const encodedMessage = encodeURIComponent(message);
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}

export function generateFollowUpUrl(
  whatsappNumber: string,
  storeName: string,
  orderId: string,
  items: OrderItem[],
  total: number
): string {
  const shortId = orderId.slice(0, 8).toUpperCase();
  const lines: string[] = [];

  lines.push(`*Follow-up: Order #${shortId} from ${storeName}*`);
  lines.push("");
  lines.push("------");
  lines.push("");

  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.product_name}`);
    if (item.variant_name) {
      lines.push(`   ${item.variant_name}`);
    }
    lines.push(`   Qty: ${item.quantity} x ₦${item.price.toLocaleString()}`);
    lines.push("");
  });

  lines.push("------");
  lines.push(`*TOTAL: ₦${total.toLocaleString()}*`);
  lines.push("");
  lines.push("------");
  lines.push("");
  lines.push("Hi, I'm following up on my order above. Thank you!");

  const encodedMessage = encodeURIComponent(lines.join("\n"));
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}

function formatOrderMessage(storeName: string, items: CartItem[]): string {
  const lines: string[] = [];

  lines.push(`*New Order from ${storeName}*`);
  lines.push("");
  lines.push("------");
  lines.push("");

  let total = 0;

  items.forEach((item, index) => {
    const price = item.variant?.price ?? item.product.price;
    const itemTotal = price * item.quantity;
    total += itemTotal;

    lines.push(`${index + 1}. ${item.product.name}`);
    if (item.variant) {
      lines.push(`   ${item.variant.option_name}: ${item.variant.option_value}`);
    }
    lines.push(
      `   Qty: ${item.quantity} x ₦${price.toLocaleString()}`
    );
    lines.push(`   Subtotal: ₦${itemTotal.toLocaleString()}`);
    lines.push("");
  });

  lines.push("------");
  lines.push(`*TOTAL: ₦${total.toLocaleString()}*`);
  lines.push("");
  lines.push("------");
  lines.push("");
  lines.push("I would like to place this order.");

  return lines.join("\n");
}

// ─── Instagram ───────────────────────────────────────────────────────────────

export function generateInstagramUrl(instagramHandle: string): string {
  const handle = instagramHandle.replace(/^@/, "");
  return `https://www.instagram.com/${handle}/`;
}

export async function copyOrderToClipboard(
  storeName: string,
  items: CartItem[]
): Promise<boolean> {
  const message = formatOrderMessage(storeName, items);
  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = message;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
}

// ─── Channel helpers ─────────────────────────────────────────────────────────

export function hasWhatsApp(whatsappNumber: string | null | undefined): boolean {
  return Boolean(whatsappNumber && whatsappNumber.replace(/[^0-9]/g, "").length >= 8);
}

export function hasInstagram(instagramHandle: string | null | undefined): boolean {
  return Boolean(instagramHandle && instagramHandle.trim().length > 0);
}

export function getChannelCount(
  whatsappNumber: string | null | undefined,
  instagramHandle: string | null | undefined
): number {
  let count = 0;
  if (hasWhatsApp(whatsappNumber)) count++;
  if (hasInstagram(instagramHandle)) count++;
  return count;
}
