import { CartItem } from "@/types";

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
