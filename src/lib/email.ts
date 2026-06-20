const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "ggraphixc@gmail.com";
const BREVO_SENDER_NAME = "StallHq";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";

interface BrevoEmail {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
}

async function sendBrevoEmail({ to, subject, htmlContent, textContent, tags }: BrevoEmail) {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
        to,
        subject,
        htmlContent,
        textContent,
        tags,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Brevo API error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to send email via Brevo:", error);
    return false;
  }
}

// ─── Email wrapper (dark ambient theme) ──────────────────────────────────────

function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#06060b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#06060b;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#13131d;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
              ${content}
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
              <tr>
                <td style="padding:24px 0;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#4b5563;">
                    Built by <a href="${APP_URL}" style="color:#a855f7;text-decoration:none;">StallHq</a> &mdash; Free digital storefronts for WhatsApp vendors
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ─── Format helpers ──────────────────────────────────────────────────────────

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
  return `\u20a6${amount.toLocaleString()}`;
}

function buildItemsList(items: OrderItem[]): string {
  return items
    .map((item) => {
      const variant = item.variant_name ? ` (${item.variant_name})` : "";
      return `<tr>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06);color:#e0e0e0;font-size:14px;">${item.product_name}${variant}</td>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;color:#94a3b8;font-size:14px;">${item.quantity}</td>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;color:#e0e0e0;font-size:14px;font-weight:600;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>`;
    })
    .join("");
}

// ─── Auth emails ─────────────────────────────────────────────────────────────

export async function sendVerificationEmail({
  email,
  code,
  name,
}: {
  email: string;
  code: string;
  name?: string;
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;font-weight:700;">&#9993;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Verify your email</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">StallHq</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting},</p>
          <p style="margin:12px 0 0;font-size:15px;color:#e0e0e0;line-height:1.6;">Use the code below to verify your email address:</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;text-align:center;">
          <div style="display:inline-block;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.2);border-radius:12px;padding:20px 40px;">
            <span style="font-size:32px;font-weight:800;color:#a78bfa;letter-spacing:8px;">${code}</span>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">This code expires in 15 minutes. If you didn't create an account, you can safely ignore this email.</p>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: `Your verification code: ${code}`,
    htmlContent: html,
    tags: ["auth", "verification"],
  });
}

export async function sendPasswordResetEmail({
  email,
  token,
  name,
}: {
  email: string;
  token: string;
  name?: string;
}) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;
  const greeting = name ? `Hi ${name}` : "Hi there";

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#ef4444);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;font-weight:700;">&#128274;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Reset your password</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">StallHq</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting},</p>
          <p style="margin:12px 0 0;font-size:15px;color:#e0e0e0;line-height:1.6;">We received a request to reset your password. Click the button below to set a new one:</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;text-align:center;">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">Reset Password</a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: "Reset your StallHq password",
    htmlContent: html,
    tags: ["auth", "password_reset"],
  });
}

export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name?: string;
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#10024;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Welcome to StallHq!</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">Your email has been verified</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting},</p>
          <p style="margin:12px 0 0;font-size:15px;color:#e0e0e0;line-height:1.6;">Your account is ready. Create your store, add products, and start selling on WhatsApp in minutes.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/onboarding" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">Create Your Store</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: "Welcome to StallHq!",
    htmlContent: html,
    tags: ["auth", "welcome"],
  });
}

// ─── Order emails ────────────────────────────────────────────────────────────

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

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#128722;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">New Order Received</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.15);border-radius:12px;">
            <tr>
              <td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:4px 0;"><span style="font-size:13px;color:#94a3b8;">Order</span></td>
                    <td style="padding:4px 0;text-align:right;"><span style="font-size:14px;font-weight:600;color:#a78bfa;">#${shortId}</span></td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;"><span style="font-size:13px;color:#94a3b8;">Customer</span></td>
                    <td style="padding:4px 0;text-align:right;"><span style="font-size:14px;color:#f1f5f9;">${customer}</span></td>
                  </tr>
                  ${customerPhone ? `<tr>
                    <td style="padding:4px 0;"><span style="font-size:13px;color:#94a3b8;">Phone</span></td>
                    <td style="padding:4px 0;text-align:right;"><span style="font-size:14px;color:#f1f5f9;">${customerPhone}</span></td>
                  </tr>` : ""}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr style="border-bottom:2px solid rgba(255,255,255,0.06);">
              <td style="padding:8px 16px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Item</td>
              <td style="padding:8px 16px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;text-align:center;">Qty</td>
              <td style="padding:8px 16px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;text-align:right;">Price</td>
            </tr>
            ${buildItemsList(items)}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15);border-radius:12px;">
            <tr>
              <td style="padding:16px 20px;"><span style="font-size:14px;color:#94a3b8;">Total</span></td>
              <td style="padding:16px 20px;text-align:right;"><span style="font-size:20px;font-weight:700;color:#22c55e;">${formatCurrency(total)}</span></td>
            </tr>
          </table>
        </td>
      </tr>
      ${notes ? `<tr>
        <td style="padding:0 32px 24px;">
          <div style="padding:14px 18px;background:rgba(168,85,247,0.06);border-left:3px solid #a855f7;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:13px;color:#94a3b8;"><strong style="color:#a78bfa;">Note:</strong> ${notes}</p>
          </div>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">View in Dashboard</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email: storeEmail }],
    subject: `New order #${shortId} from ${customer} - ${storeName}`,
    htmlContent: html,
    tags: ["order", "notification"],
  });
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

  const statusConfig: Record<string, { color: string; bg: string; border: string; icon: string; message: string }> = {
    pending: { color: "#eab308", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.15)", icon: "&#9203;", message: "Your order is being reviewed." },
    confirmed: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.15)", icon: "&#9989;", message: "Your order has been confirmed!" },
    shipped: { color: "#a78bfa", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.15)", icon: "&#128230;", message: "Your order is on its way!" },
    delivered: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.15)", icon: "&#127881;", message: "Your order has been delivered! Thank you for your purchase." },
    cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.15)", icon: "&#10060;", message: "Your order has been cancelled. Please contact the store for more details." },
  };

  const cfg = statusConfig[status] || statusConfig.pending;

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">${cfg.icon}</div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Order ${statusLabel}</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;text-align:center;">
          <div style="display:inline-block;background:${cfg.bg};border:1px solid ${cfg.border};border-radius:12px;padding:16px 28px;">
            <p style="margin:0;font-size:13px;color:#94a3b8;">Order #${shortId}</p>
            <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:${cfg.color};">${statusLabel}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;text-align:center;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${cfg.message}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Items ordered</p>
                ${items
                  .map((item) => {
                    const variant = item.variant_name ? ` (${item.variant_name})` : "";
                    return `<p style="margin:4px 0;font-size:14px;color:#e0e0e0;">${item.product_name}${variant} &times; ${item.quantity}</p>`;
                  })
                  .join("")}
                <p style="margin:12px 0 0;font-size:18px;font-weight:700;color:#22c55e;">${formatCurrency(total)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="https://wa.me/" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">Contact on WhatsApp</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email: customerEmail }],
    subject: `Order #${shortId} ${statusLabel} - ${storeName}`,
    htmlContent: html,
    tags: ["order", "status_update"],
  });
}
