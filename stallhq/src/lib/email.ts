import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "StallHq <notifications@stallhq.link>";

interface OrderItem {
  product_name: string;
  variant_name?: string;
  price: number;
  quantity: number;
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}

function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

function buildItemsList(items: OrderItem[]): string {
  return items
    .map((item) => {
      const variant = item.variant_name ? ` (${item.variant_name})` : "";
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a3e;">${item.product_name}${variant}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a3e;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a3e;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>`;
    })
    .join("");
}

export async function sendOrderNotification({
  storeEmail,
  storeName,
  orderId,
  customerName,
  customerPhone,
  items,
  total,
  notes,
}: {
  storeEmail: string;
  storeName: string;
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  notes?: string;
}) {
  const customer = customerName || "Anonymous";
  const shortId = orderId.slice(0, 8).toUpperCase();

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#e0e0e0;">
      <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">New Order Received</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">${storeName}</p>
      </div>

      <div style="padding:24px;">
        <div style="background:#16213e;border-radius:8px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 8px;"><strong style="color:#a78bfa;">Order ID:</strong> #${shortId}</p>
          <p style="margin:0 0 8px;"><strong style="color:#a78bfa;">Customer:</strong> ${customer}</p>
          ${customerPhone ? `<p style="margin:0;"><strong style="color:#a78bfa;">Phone:</strong> ${customerPhone}</p>` : ""}
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr style="border-bottom:2px solid #2a2a3e;">
              <th style="padding:8px 12px;text-align:left;color:#a78bfa;">Item</th>
              <th style="padding:8px 12px;text-align:center;color:#a78bfa;">Qty</th>
              <th style="padding:8px 12px;text-align:right;color:#a78bfa;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${buildItemsList(items)}
          </tbody>
        </table>

        <div style="background:#16213e;border-radius:8px;padding:16px;text-align:right;">
          <span style="font-size:18px;font-weight:bold;color:#22c55e;">${formatCurrency(total)}</span>
        </div>

        ${notes ? `<div style="margin-top:16px;padding:12px;background:#1e1e3a;border-radius:8px;border-left:3px solid #a78bfa;">
          <p style="margin:0;color:#9ca3af;font-size:14px;"><strong>Note:</strong> ${notes}</p>
        </div>` : ""}
      </div>

      <div style="padding:16px 24px;text-align:center;color:#6b7280;font-size:12px;border-top:1px solid #2a2a3e;">
        <p style="margin:0;">Manage this order in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color:#a78bfa;">StallHq Dashboard</a></p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: storeEmail,
      subject: `New order #${shortId} from ${customer} - ${storeName}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send order notification:", error);
  }
}

export async function sendStatusUpdateEmail({
  customerEmail,
  storeName,
  orderId,
  status,
  items,
  total,
}: {
  customerEmail: string;
  storeName: string;
  orderId: string;
  status: string;
  items: OrderItem[];
  total: number;
}) {
  const shortId = orderId.slice(0, 8).toUpperCase();
  const statusLabel = formatStatus(status);

  const statusColors: Record<string, string> = {
    pending: "#eab308",
    confirmed: "#3b82f6",
    shipped: "#a78bfa",
    delivered: "#22c55e",
    cancelled: "#ef4444",
  };

  const statusColor = statusColors[status] || "#6b7280";

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#e0e0e0;">
      <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Order Status Update</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">${storeName}</p>
      </div>

      <div style="padding:24px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:${statusColor}20;border:2px solid ${statusColor};border-radius:8px;padding:12px 24px;">
            <p style="margin:0;font-size:14px;color:#9ca3af;">Order #${shortId}</p>
            <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:${statusColor};">${statusLabel}</p>
          </div>
        </div>

        <div style="background:#16213e;border-radius:8px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 8px;color:#9ca3af;font-size:14px;">Items ordered:</p>
          ${items
            .map((item) => {
              const variant = item.variant_name ? ` (${item.variant_name})` : "";
              return `<p style="margin:4px 0;">${item.product_name}${variant} × ${item.quantity}</p>`;
            })
            .join("")}
          <p style="margin:12px 0 0;font-size:18px;font-weight:bold;color:#22c55e;">${formatCurrency(total)}</p>
        </div>

        ${status === "delivered" ? `<div style="text-align:center;padding:16px;background:#22c55e10;border-radius:8px;border:1px solid #22c55e30;">
          <p style="margin:0;color:#22c55e;">Your order has been delivered! Thank you for your purchase.</p>
        </div>` : ""}

        ${status === "cancelled" ? `<div style="text-align:center;padding:16px;background:#ef444410;border-radius:8px;border:1px solid #ef444430;">
          <p style="margin:0;color:#ef4444;">Your order has been cancelled. Please contact the store for more details.</p>
        </div>` : ""}
      </div>

      <div style="padding:16px 24px;text-align:center;color:#6b7280;font-size:12px;border-top:1px solid #2a2a3e;">
        <p style="margin:0;">Questions? Contact <a href="https://wa.me/${""}" style="color:#a78bfa;">${storeName}</a> on WhatsApp</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Order #${shortId} ${statusLabel} - ${storeName}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send status update email:", error);
  }
}
