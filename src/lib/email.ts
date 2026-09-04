import { SubscriptionPlan } from "@/types";
import { getPlanName, formatNaira } from "@/lib/subscription";
import { createClient } from "@supabase/supabase-js";

const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "ggraphixc@gmail.com";
const DEFAULT_PLATFORM_NAME = "stallHq";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hqlink.vercel.app";

// ─── A/B Subject Line Helper ─────────────────────────────────────────────────
// Picks a random subject line from an array. Pass the variant as a tag for tracking.
function pickSubject(variants: string[]): { subject: string; variant: string } {
  const index = Math.floor(Math.random() * variants.length);
  return { subject: variants[index], variant: `v${index + 1}` };
}

// ─── UTM Tracking Helper ─────────────────────────────────────────────────────
// Appends UTM parameters to a URL for email click tracking.
function trackUrl(url: string, campaign: string, medium = "email", source = "brevo"): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`;
}

// Cache platform name in memory (fetched once per serverless instance)
let cachedPlatformName: string | null = null;

// Cache email templates in memory (fetched once per serverless instance)
let cachedTemplates: Record<string, { html_body: string; subject_template: string | null; variables: string[] }> | null = null;

async function getPlatformName(): Promise<string> {
  if (cachedPlatformName) return cachedPlatformName;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "platform_name")
      .single();
    if (data?.value) {
      cachedPlatformName = data.value;
      return data.value;
    }
  } catch {}
  cachedPlatformName = DEFAULT_PLATFORM_NAME;
  return DEFAULT_PLATFORM_NAME;
}

async function loadTemplatesFromDB(): Promise<Record<string, { html_body: string; subject_template: string | null; variables: string[] }>> {
  if (cachedTemplates) return cachedTemplates;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("email_templates")
      .select("slug, html_body, subject_template, variables")
      .eq("is_active", true);
    if (data) {
      cachedTemplates = data.reduce((acc, t) => {
        acc[t.slug] = {
          html_body: t.html_body,
          subject_template: t.subject_template,
          variables: Array.isArray(t.variables) ? t.variables : [],
        };
        return acc;
      }, {} as Record<string, { html_body: string; subject_template: string | null; variables: string[] }>);
      return cachedTemplates;
    }
  } catch {}
  cachedTemplates = {};
  return cachedTemplates;
}

async function getTemplateHtml(slug: string, vars: Record<string, string>): Promise<string | null> {
  const templates = await loadTemplatesFromDB();
  const tmpl = templates[slug];
  if (!tmpl) return null;
  let html = tmpl.html_body;
  for (const [key, value] of Object.entries(vars)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return html;
}

interface BrevoEmail {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
  templateSlug?: string;
  templateVars?: Record<string, string>;
}

async function sendBrevoEmail({ to, subject, htmlContent, textContent, tags, templateSlug, templateVars }: BrevoEmail) {
  if (!BREVO_API_KEY) {
    console.error("[Brevo] BREVO_API_KEY not configured");
    return false;
  }

  const platformName = await getPlatformName();

  // Try DB template first
  let finalHtml = htmlContent;
  if (templateSlug && templateVars) {
    const dbHtml = await getTemplateHtml(templateSlug, templateVars);
    if (dbHtml) finalHtml = dbHtml;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: platformName },
        to,
        subject,
        htmlContent: finalHtml,
        textContent,
        tags,
      }),
    });

    const resBody = await response.json();

    if (!response.ok) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Email wrapper (dark ambient theme) ──────────────────────────────────────

function emailWrapper(content: string, platformName?: string): string {
  const name = platformName || DEFAULT_PLATFORM_NAME;
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
                <td style="padding:24px 0 8px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#4b5563;">
                    Built by <a href="${APP_URL}" style="color:#a855f7;text-decoration:none;">${name}</a> &mdash; Free digital storefronts for WhatsApp vendors
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 0 24px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#4b5563;">
                    <a href="${APP_URL}/email-preferences" style="color:#6b7280;text-decoration:underline;">Email Preferences</a>
                    &nbsp;&middot;&nbsp;
                    <a href="${APP_URL}/unsubscribe" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
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
  const platformName = await getPlatformName();

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;font-weight:700;">&#9993;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Verify your email</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${platformName}</p>
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
    templateSlug: "email-verification",
    templateVars: { greeting, code, platform_name: platformName, app_url: APP_URL },
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
  const platformName = await getPlatformName();

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#ef4444);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;font-weight:700;">&#128274;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Reset your password</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${platformName}</p>
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
    subject: `Reset your ${platformName} password`,
    htmlContent: html,
    tags: ["auth", "password_reset"],
    templateSlug: "password-reset",
    templateVars: { greeting, reset_url: resetUrl, platform_name: platformName, app_url: APP_URL },
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
  const platformName = await getPlatformName();

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#10024;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Welcome to ${platformName}!</h1>
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
    subject: `Welcome to ${platformName}!`,
    htmlContent: html,
    tags: ["auth", "welcome"],
    templateSlug: "welcome-email",
    templateVars: { greeting, platform_name: platformName, app_url: APP_URL },
  });
}

// ─── Order emails ────────────────────────────────────────────────────────────

// ─── Subscription emails ─────────────────────────────────────────────────────

export async function sendTrialExpiryReminder({
  email,
  storeName,
  storeSlug,
  daysLeft,
}: {
  email: string;
  storeName: string;
  storeSlug: string;
  daysLeft: number;
}) {
  const platformName = await getPlatformName();
  const urgency = daysLeft <= 1 ? "tomorrow" : `in ${daysLeft} days`;
  const icon = daysLeft <= 1 ? "&#9888;" : "&#9203;";
  const bgColor = daysLeft <= 1 ? "rgba(239,68,68,0.08)" : "rgba(234,179,8,0.08)";
  const borderColor = daysLeft <= 1 ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.15)";
  const accentColor = daysLeft <= 1 ? "#ef4444" : "#eab308";

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">${icon}</div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Trial Expiring ${urgency}</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:12px;padding:20px;text-align:center;">
            <p style="margin:0;font-size:32px;font-weight:700;color:${accentColor};">${daysLeft}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">${daysLeft === 1 ? "day" : "days"} remaining</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">Your free trial for <strong>${storeName}</strong> expires ${urgency}. Upgrade now to keep your store live and your products visible to customers.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.12);border-radius:12px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">What happens if you don't upgrade?</p>
                <p style="margin:0;font-size:13px;color:#e0e0e0;line-height:1.5;">Your store goes offline and customers can no longer browse your products. Your data is preserved — upgrade anytime to bring it back.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/upgrade" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">Upgrade Now</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: daysLeft <= 1
      ? `⚠️ Your ${platformName} trial expires tomorrow — ${storeName}`
      : `Your ${platformName} trial expires in ${daysLeft} days — ${storeName}`,
    htmlContent: html,
    tags: ["subscription", "trial_expiry"],
    templateSlug: "trial-expiry-reminder",
    templateVars: { store_name: storeName, store_slug: storeSlug, days_left: String(daysLeft), platform_name: platformName, app_url: APP_URL },
  });
}

export async function sendSubscriptionExpiryReminder({
  email,
  storeName,
  plan,
  daysLeft,
}: {
  email: string;
  storeName: string;
  plan: string;
  daysLeft: number;
}) {
  const platformName = await getPlatformName();
  const urgency = daysLeft <= 1 ? "tomorrow" : `in ${daysLeft} days`;
  const icon = daysLeft <= 1 ? "&#9888;" : "&#9203;";
  const bgColor = daysLeft <= 1 ? "rgba(239,68,68,0.08)" : "rgba(234,179,8,0.08)";
  const accentColor = daysLeft <= 1 ? "#ef4444" : "#eab308";
  const planLabel = getPlanName(plan as SubscriptionPlan);

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">${icon}</div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Subscription Expiring ${urgency}</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <div style="background:${bgColor};border:1px solid ${bgColor.replace("0.08", "0.15")};border-radius:12px;padding:20px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#94a3b8;">Current plan</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:${accentColor};">${planLabel}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">${daysLeft} ${daysLeft === 1 ? "day" : "days"} remaining</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">Your <strong>${planLabel}</strong> subscription for <strong>${storeName}</strong> expires ${urgency}. Renew now to keep your store live with all your plan features.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/upgrade" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">Renew Now</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: daysLeft <= 1
      ? `⚠️ Your ${platformName} subscription expires tomorrow — ${storeName}`
      : `Your ${platformName} subscription expires in ${daysLeft} days — ${storeName}`,
    htmlContent: html,
    tags: ["subscription", "subscription_expiry"],
    templateSlug: "subscription-expiry-reminder",
    templateVars: { store_name: storeName, plan: planLabel, days_left: String(daysLeft), platform_name: platformName, app_url: APP_URL },
  });
}

// ─── Inventory emails ───────────────────────────────────────────────

export async function sendLowStockAlert({
  storeEmail,
  storeName,
  storeSlug,
  items,
  threshold,
}: {
  storeEmail: string;
  storeName: string;
  storeSlug: string;
  items: { name: string; stock: number; variant?: string }[];
  threshold: number;
}) {
  const itemList = items
    .map((item) => {
      const variant = item.variant ? ` (${item.variant})` : "";
      return `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.06);color:#e0e0e0;font-size:14px;">${item.name}${variant}</td>
        <td style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;font-size:14px;font-weight:600;color:${item.stock === 0 ? "#ef4444" : "#eab308"};">${item.stock}</td>
      </tr>`;
    })
    .join("");

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#eab308,#f97316);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#9888;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Low Stock Alert</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${items.length} product${items.length > 1 ? "s" : ""} in your store ${items.length > 1 ? "have" : "has"} stock at or below <strong>${threshold}</strong> units.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(234,179,8,0.06);border:1px solid rgba(234,179,8,0.12);border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid rgba(255,255,255,0.06);">Product</td>
              <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06);">Stock</td>
            </tr>
            ${itemList}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/dashboard/products" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">Manage Products</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email: storeEmail }],
    subject: `⚠️ Low stock alert — ${storeName}`,
    htmlContent: html,
    tags: ["inventory", "low_stock"],
    templateSlug: "low-stock-alert",
    templateVars: { store_name: storeName, store_slug: storeSlug, threshold: String(threshold), item_count: String(items.length), platform_name: (await getPlatformName()), app_url: APP_URL },
  });
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
    templateSlug: "new-order-notification",
    templateVars: { store_name: storeName, order_id: shortId, customer_name: customer, customer_phone: customerPhone || "", total: formatCurrency(total), notes: notes || "", platform_name: (await getPlatformName()), app_url: APP_URL },
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
          <a href="${APP_URL}/order/${orderId}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">View Order</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email: customerEmail }],
    subject: `Order #${shortId} ${statusLabel} - ${storeName}`,
    htmlContent: html,
    tags: ["order", "status_update"],
    templateSlug: "order-status-update",
    templateVars: { store_name: storeName, order_id: shortId, status: statusLabel, total: formatCurrency(total), platform_name: (await getPlatformName()), app_url: APP_URL },
  });
}

// ─── Support emails ──────────────────────────────────────────────────

export async function sendSupportTicketCreated({
  adminEmail,
  vendorEmail,
  ticketId,
  subject,
  category,
}: {
  adminEmail: string;
  vendorEmail: string;
  ticketId: string;
  subject: string;
  category: string;
}) {
  const shortId = ticketId.slice(0, 8);
  const categoryLabel = category.replace("_", " ");

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#128172;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">New Support Ticket</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">Ticket #${shortId}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.15);border-radius:12px;">
            <tr>
              <td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:4px 0;"><span style="font-size:13px;color:#94a3b8;">Subject</span></td>
                    <td style="padding:4px 0;text-align:right;"><span style="font-size:14px;font-weight:600;color:#a78bfa;">${subject}</span></td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;"><span style="font-size:13px;color:#94a3b8;">Category</span></td>
                    <td style="padding:4px 0;text-align:right;"><span style="font-size:14px;color:#f1f5f9;text-transform:capitalize;">${categoryLabel}</span></td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">A vendor has submitted a new support ticket. Log in to the admin panel to view and respond.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/admin/support" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">View Ticket</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email: adminEmail }],
    subject: `New support ticket #${shortId}: ${subject}`,
    htmlContent: html,
    tags: ["support", "new_ticket"],
    templateSlug: "new-support-ticket",
    templateVars: { ticket_id: shortId, subject, category: categoryLabel, vendor_email: vendorEmail, app_url: APP_URL },
  });
}

export async function sendSupportReplyNotification({
  vendorEmail,
  ticketId,
  subject,
  replyPreview,
}: {
  vendorEmail: string;
  ticketId: string;
  subject: string;
  replyPreview: string;
}) {
  const shortId = ticketId.slice(0, 8);

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#10b981,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#128172;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Support Reply</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">Ticket #${shortId}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">The support team has replied to your ticket <strong>"${subject}"</strong>:</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <div style="padding:14px 18px;background:rgba(16,185,129,0.06);border-left:3px solid #10b981;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:13px;color:#e0e0e0;line-height:1.5;">${replyPreview.slice(0, 200)}${replyPreview.length > 200 ? "..." : ""}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/dashboard/support?ticket=${ticketId}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">View Ticket</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email: vendorEmail }],
    subject: `Support reply on ticket #${shortId}: ${subject}`,
    htmlContent: html,
    tags: ["support", "reply"],
    templateSlug: "support-reply-notification",
    templateVars: { ticket_id: shortId, subject, reply_preview: replyPreview.slice(0, 200), app_url: APP_URL },
  });
}

// ─── Marketing email sequences ───────────────────────────────────────────────

export async function sendTrialNurtureDay1({
  email,
  name,
  storeName,
  storeSlug,
}: {
  email: string;
  name?: string;
  storeName: string;
  storeSlug: string;
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  const platformName = await getPlatformName();

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#127881;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Welcome aboard!</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">Your store is live</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting},</p>
          <p style="margin:12px 0 0;font-size:15px;color:#e0e0e0;line-height:1.6;">Your store <strong>${storeName}</strong> is now live on ${platformName}! Here are 3 things to do right now to get your first order:</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.12);border-radius:12px;">
            <tr>
              <td style="padding:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;width:32px;">
                      <div style="width:24px;height:24px;border-radius:50%;background:rgba(168,85,247,0.15);text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#a78bfa;">1</div>
                    </td>
                    <td style="padding:8px 0 8px 12px;">
                      <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;">Add product photos</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Stores with images get 3x more orders. Upload clear, well-lit photos.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;width:32px;">
                      <div style="width:24px;height:24px;border-radius:50%;background:rgba(168,85,247,0.15);text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#a78bfa;">2</div>
                    </td>
                    <td style="padding:8px 0 8px 12px;">
                      <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;">Share your store link</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Put it in your WhatsApp bio, Instagram bio, and TikTok profile.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;width:32px;">
                      <div style="width:24px;height:24px;border-radius:50%;background:rgba(168,85,247,0.15);text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#a78bfa;">3</div>
                    </td>
                    <td style="padding:8px 0 8px 12px;">
                      <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;">Tell 5 friends today</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Word of mouth is the #1 channel for WhatsApp vendors.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/${storeSlug}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">View Your Store</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: `Your store is live! 3 steps to get your first order`,
    htmlContent: html,
    tags: ["marketing", "trial_nurture", "day1"],
    templateSlug: "trial-nurture-day1",
    templateVars: { greeting, store_name: storeName, store_slug: storeSlug, platform_name: platformName, app_url: APP_URL },
  });
}

export async function sendTrialNurtureDay3({
  email,
  name,
  storeName,
  storeSlug,
  productCount,
}: {
  email: string;
  name?: string;
  storeName: string;
  storeSlug: string;
  productCount: number;
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  const platformName = await getPlatformName();
  const hasProducts = productCount > 0;

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#10b981,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#128161;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">${hasProducts ? "Your store is looking good!" : "Add your first product"}</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting},</p>
          <p style="margin:12px 0 0;font-size:15px;color:#e0e0e0;line-height:1.6;">${
            hasProducts
              ? `You have ${productCount} product${productCount > 1 ? "s" : ""} on ${storeName}. Here's a tip from top vendors:`
              : `You haven't added any products yet. It takes 2 minutes to add your first product.`
          }</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <div style="padding:16px 20px;background:rgba(16,185,129,0.06);border-left:3px solid #10b981;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:14px;color:#e0e0e0;line-height:1.5;"><strong style="color:#10b981;">Pro tip:</strong> Vendors who add at least 5 products and share their link within the first 3 days get 70% more orders in their first week.</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">${hasProducts ? "Manage Your Store" : "Add Products Now"}</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: hasProducts
      ? `Tip: Get more orders from ${storeName}`
      : `Add your first product to ${storeName} — it takes 2 minutes`,
    htmlContent: html,
    tags: ["marketing", "trial_nurture", "day3"],
    templateSlug: "trial-nurture-day3",
    templateVars: { greeting, store_name: storeName, store_slug: storeSlug, product_count: String(productCount), platform_name: platformName, app_url: APP_URL },
  });
}

export async function sendTrialNurtureDay5({
  email,
  name,
  storeName,
  storeSlug,
  daysLeft,
}: {
  email: string;
  name?: string;
  storeName: string;
  storeSlug: string;
  daysLeft: number;
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  const platformName = await getPlatformName();

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#ef4444);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#9888;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Your trial expires in ${daysLeft} days</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">Keep your store live</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting},</p>
          <p style="margin:12px 0 0;font-size:15px;color:#e0e0e0;line-height:1.6;">Your free trial for <strong>${storeName}</strong> expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}. Upgrade now to keep your store live and continue receiving orders.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.12);border-radius:12px;">
            <tr>
              <td style="padding:20px;">
                <p style="margin:0 0 12px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">What you get with a paid plan:</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${[
                    "Your own store URL (stallhq.link/yourstore)",
                    "Unlimited products with photos",
                    "Order tracking dashboard",
                    "QR code for offline sales",
                    "Verified vendor badge",
                    "Priority support",
                  ]
                    .map(
                      (f) => `
                    <tr>
                      <td style="padding:4px 0;vertical-align:top;width:20px;">
                        <span style="color:#22c55e;font-size:14px;">&#10003;</span>
                      </td>
                      <td style="padding:4px 0;font-size:13px;color:#e0e0e0;">${f}</td>
                    </tr>`
                    )
                    .join("")}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/upgrade" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">Upgrade Now — From ${formatNaira(3500)}/month</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: `Your trial expires in ${daysLeft} days — upgrade to keep ${storeName} live`,
    htmlContent: html,
    tags: ["marketing", "trial_nurture", "day5"],
    templateSlug: "trial-nurture-day5",
    templateVars: { greeting, store_name: storeName, store_slug: storeSlug, days_left: String(daysLeft), platform_name: platformName, app_url: APP_URL },
  });
}

export async function sendTrialNurtureDay7({
  email,
  name,
  storeName,
  storeSlug,
}: {
  email: string;
  name?: string;
  storeName: string;
  storeSlug: string;
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  const platformName = await getPlatformName();

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#128200;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Halfway through your trial!</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting},</p>
          <p style="margin:12px 0 0;font-size:15px;color:#e0e0e0;line-height:1.6;">You're 7 days into your 14-day trial for <strong>${storeName}</strong>. Here's how top vendors use their second week:</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.12);border-radius:12px;">
            <tr>
              <td style="padding:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;width:32px;">
                      <div style="width:24px;height:24px;border-radius:50%;background:rgba(59,130,246,0.15);text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#60a5fa;">1</div>
                    </td>
                    <td style="padding:8px 0 8px 12px;">
                      <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;">Add more products</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Stores with 5+ products get 3x more orders than those with just 1-2.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;width:32px;">
                      <div style="width:24px;height:24px;border-radius:50%;background:rgba(59,130,246,0.15);text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#60a5fa;">2</div>
                    </td>
                    <td style="padding:8px 0 8px 12px;">
                      <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;">Share your store link in WhatsApp groups</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Drop your link in 3-5 active buying groups today.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;width:32px;">
                      <div style="width:24px;height:24px;border-radius:50%;background:rgba(59,130,246,0.15);text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#60a5fa;">3</div>
                    </td>
                    <td style="padding:8px 0 8px 12px;">
                      <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;">Check your analytics</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">See which products get the most views and double down on those.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">View Your Dashboard</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: `You're halfway through your trial — here's how to get more orders`,
    htmlContent: html,
    tags: ["marketing", "trial_nurture", "day7"],
    templateSlug: "trial-nurture-day7",
    templateVars: { greeting, store_name: storeName, store_slug: storeSlug, platform_name: platformName, app_url: APP_URL },
  });
}

export async function sendTrialNurtureDay10({
  email,
  name,
  storeName,
  storeSlug,
  daysLeft,
}: {
  email: string;
  name?: string;
  storeName: string;
  storeSlug: string;
  daysLeft: number;
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  const platformName = await getPlatformName();

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#ef4444);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#9203;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">${daysLeft} days left in your trial</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting},</p>
          <p style="margin:12px 0 0;font-size:15px;color:#e0e0e0;line-height:1.6;">Your free trial for <strong>${storeName}</strong> has ${daysLeft} days left. After that, your store goes offline — but all your data stays safe.</p>
        </td>
      </tr>
      <tr>
n        <td style="padding:0 32px 24px;">
          <div style="padding:16px 20px;background:rgba(168,85,247,0.06);border-left:3px solid #a855f7;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:14px;color:#e0e0e0;line-height:1.5;"><strong style="color:#a78bfa;">Tip:</strong> Upgrade before your trial ends to keep your store live without interruption. Your customers won't notice any downtime.</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/upgrade" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">Upgrade Now</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: `${daysLeft} days left — keep ${storeName} live after your trial`,
    htmlContent: html,
    tags: ["marketing", "trial_nurture", "day10"],
    templateSlug: "trial-nurture-day10",
    templateVars: { greeting, store_name: storeName, store_slug: storeSlug, days_left: String(daysLeft), platform_name: platformName, app_url: APP_URL },
  });
}

export async function sendUpgradeThankYou({
  email,
  name,
  storeName,
  plan,
}: {
  email: string;
  name?: string;
  storeName: string;
  plan: string;
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  const platformName = await getPlatformName();
  const planLabel = getPlanName(plan as SubscriptionPlan);

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#10b981,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#127881;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Welcome to ${planLabel}!</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">Thank you for upgrading</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting},</p>
          <p style="margin:12px 0 0;font-size:15px;color:#e0e0e0;line-height:1.6;">You've upgraded <strong>${storeName}</strong> to the <strong>${planLabel}</strong> plan. Your store now has all premium features unlocked.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <div style="padding:16px 20px;background:rgba(16,185,129,0.06);border-left:3px solid #10b981;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:14px;color:#e0e0e0;line-height:1.5;"><strong style="color:#10b981;">What's next?</strong> Focus on adding great products and sharing your store link. We'll handle the rest.</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">Go to Dashboard</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: `Welcome to ${planLabel} — ${storeName} is now premium`,
    htmlContent: html,
    tags: ["marketing", "upgrade", "thank_you"],
    templateSlug: "upgrade-thank-you",
    templateVars: { greeting, store_name: storeName, plan: planLabel, platform_name: platformName, app_url: APP_URL },
  });
}

export async function sendWinBackEmail({
  email,
  name,
  storeName,
  storeSlug,
  daysSinceExpiry,
}: {
  email: string;
  name?: string;
  storeName: string;
  storeSlug: string;
  daysSinceExpiry: number;
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  const platformName = await getPlatformName();

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#128148;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">We miss you!</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName} is offline</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting},</p>
          <p style="margin:12px 0 0;font-size:15px;color:#e0e0e0;line-height:1.6;">It's been ${daysSinceExpiry} day${daysSinceExpiry > 1 ? "s" : ""} since your subscription expired. Your store <strong>${storeName}</strong> is currently offline and customers can't browse your products.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.12);border-radius:12px;">
            <tr>
              <td style="padding:20px;">
                <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Quick reminder</p>
                <p style="margin:0;font-size:14px;color:#e0e0e0;line-height:1.5;">Your data is safe. All your products, orders, and store settings are preserved. Upgrade anytime to bring your store back online instantly.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/upgrade" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">Reactivate Your Store</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: `We miss you — bring ${storeName} back online`,
    htmlContent: html,
    tags: ["marketing", "win_back"],
    templateSlug: "win-back-email",
    templateVars: { greeting, store_name: storeName, store_slug: storeSlug, days_since_expiry: String(daysSinceExpiry), platform_name: platformName, app_url: APP_URL },
  });
}

export async function sendWeeklyDigest({
  email,
  name,
  storeName,
  storeSlug,
  stats,
}: {
  email: string;
  name?: string;
  storeName: string;
  storeSlug: string;
  stats: {
    visits: number;
    orders: number;
    whatsappClicks: number;
    topProduct?: string;
  };
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  const platformName = await getPlatformName();

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#128200;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Your Weekly Report</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.12);border-radius:12px;">
            <tr>
              <td style="padding:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;width:33%;text-align:center;">
                      <p style="margin:0;font-size:24px;font-weight:700;color:#a78bfa;">${stats.visits}</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Visits</p>
                    </td>
                    <td style="padding:8px 0;width:33%;text-align:center;">
                      <p style="margin:0;font-size:24px;font-weight:700;color:#22c55e;">${stats.orders}</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Orders</p>
                    </td>
                    <td style="padding:8px 0;width:33%;text-align:center;">
                      <p style="margin:0;font-size:24px;font-weight:700;color:#06b6d4;">${stats.whatsappClicks}</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">WA Clicks</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${
        stats.topProduct
          ? `<tr>
        <td style="padding:0 32px 24px;">
          <div style="padding:14px 18px;background:rgba(16,185,129,0.06);border-left:3px solid #10b981;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:14px;color:#e0e0e0;line-height:1.5;"><strong style="color:#10b981;">Top product:</strong> ${stats.topProduct}</p>
          </div>
        </td>
      </tr>`
          : ""
      }
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">View Full Dashboard</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: `Weekly report for ${storeName} — ${stats.visits} visits, ${stats.orders} orders`,
    htmlContent: html,
    tags: ["marketing", "weekly_digest"],
    templateSlug: "weekly-digest",
    templateVars: { greeting, store_name: storeName, store_slug: storeSlug, visits: String(stats.visits), orders: String(stats.orders), whatsapp_clicks: String(stats.whatsappClicks), top_product: stats.topProduct || "", platform_name: platformName, app_url: APP_URL },
  });
}

export async function sendWeeklyAnalyticsSummary({
  email,
  name,
  storeName,
  storeSlug,
  stats,
}: {
  email: string;
  name?: string;
  storeName: string;
  storeSlug: string;
  stats: {
    visits: number;
    clicks: number;
    orders: number;
    conversionRate: string;
    weekOverWeek?: {
      visits: { current: number; previous: number; trend?: number };
      clicks: { current: number; previous: number; trend?: number };
    };
    bestDay?: { day: string; avgVisits: number } | null;
    worstDay?: { day: string; avgVisits: number } | null;
    topProducts?: Array<{ name: string; count: number }>;
  };
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  const platformName = await getPlatformName();

  // Build trend badges
  const trendBadge = (trend?: number) => {
    if (trend === undefined || trend === null) return "";
    const color = trend >= 0 ? "#10b981" : "#ef4444";
    const arrow = trend >= 0 ? "&#8593;" : "&#8595;";
    return `<span style="color:${color};font-size:12px;font-weight:600;">${arrow} ${Math.abs(trend)}%</span>`;
  };

  // Build WoW comparison rows
  const wowRows = stats.weekOverWeek
    ? `
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0 0 8px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Week vs Last Week</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.12);border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:12px 16px;font-size:13px;color:#94a3b8;">Visits</td>
              <td style="padding:12px 16px;text-align:right;font-size:14px;font-weight:600;color:#f1f5f9;">${stats.weekOverWeek.visits.current.toLocaleString()}</td>
              <td style="padding:12px 16px;text-align:right;">${trendBadge(stats.weekOverWeek.visits.trend)}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;color:#94a3b8;border-top:1px solid rgba(255,255,255,0.06);">Channel Clicks</td>
              <td style="padding:12px 16px;text-align:right;font-size:14px;font-weight:600;color:#f1f5f9;border-top:1px solid rgba(255,255,255,0.06);">${stats.weekOverWeek.clicks.current.toLocaleString()}</td>
              <td style="padding:12px 16px;text-align:right;border-top:1px solid rgba(255,255,255,0.06);">${trendBadge(stats.weekOverWeek.clicks.trend)}</td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : "";

  // Build best/worst day section
  const daySection = stats.bestDay
    ? `
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${
                stats.bestDay
                  ? `<td style="padding:0 8px 0 0;width:50%;">
                <div style="padding:14px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.12);border-radius:10px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Best Day</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#10b981;">${stats.bestDay.day}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#94a3b8;">avg ${stats.bestDay.avgVisits} visits</p>
                </div>
              </td>`
                  : ""
              }
              ${
                stats.worstDay
                  ? `<td style="padding:0 0 0 8px;width:50%;">
                <div style="padding:14px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12);border-radius:10px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Slowest Day</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#ef4444;">${stats.worstDay.day}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#94a3b8;">avg ${stats.worstDay.avgVisits} visits</p>
                </div>
              </td>`
                  : ""
              }
            </tr>
          </table>
        </td>
      </tr>
    `
    : "";

  // Build funnel section
  const funnelSection = `
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0 0 8px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Conversion Funnel</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.12);border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:14px 16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <div style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden;">
                          <div style="height:100%;width:100%;background:#a855f7;border-radius:3px;"></div>
                        </div>
                        <span style="font-size:12px;color:#94a3b8;min-width:50px;">Visits</span>
                        <span style="font-size:13px;font-weight:600;color:#f1f5f9;min-width:40px;text-align:right;">${stats.visits.toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <div style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden;">
                          <div style="height:100%;width:${stats.visits > 0 ? Math.max(5, (stats.clicks / stats.visits) * 100) : 0}%;background:#10b981;border-radius:3px;"></div>
                        </div>
                        <span style="font-size:12px;color:#94a3b8;min-width:50px;">Clicks</span>
                        <span style="font-size:13px;font-weight:600;color:#f1f5f9;min-width:40px;text-align:right;">${stats.clicks.toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <div style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden;">
                          <div style="height:100%;width:${stats.clicks > 0 ? Math.max(5, (stats.orders / stats.clicks) * 100) : 0}%;background:#06b6d4;border-radius:3px;"></div>
                        </div>
                        <span style="font-size:12px;color:#94a3b8;min-width:50px;">Orders</span>
                        <span style="font-size:13px;font-weight:600;color:#f1f5f9;min-width:40px;text-align:right;">${stats.orders.toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">Click rate: <strong style="color:#10b981;">${stats.conversionRate}%</strong></p>
        </td>
      </tr>
    `;

  // Build top products section
  const topProductsSection =
    stats.topProducts && stats.topProducts.length > 0
      ? `
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0 0 8px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Top Products</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
            ${stats.topProducts
              .slice(0, 5)
              .map(
                (p, i) => `
              <tr>
                <td style="padding:10px 16px;border-bottom:${i < stats.topProducts!.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none"};">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="width:20px;height:20px;border-radius:4px;background:${i === 0 ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)"};text-align:center;line-height:20px;font-size:10px;font-weight:700;color:${i === 0 ? "#a78bfa" : "#94a3b8"};">${i + 1}</span>
                    <span style="flex:1;font-size:13px;color:#e0e0e0;">${p.name}</span>
                    <span style="font-size:12px;color:#94a3b8;">${p.count} views</span>
                  </div>
                </td>
              </tr>
            `
              )
              .join("")}
          </table>
        </td>
      </tr>
    `
      : "";

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#128200;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Your Weekly Analytics</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting}, here's what happened with your store this week.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.12);border-radius:12px;">
            <tr>
              <td style="padding:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;width:25%;text-align:center;">
                      <p style="margin:0;font-size:24px;font-weight:700;color:#a78bfa;">${stats.visits.toLocaleString()}</p>
                      <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Visits</p>
                    </td>
                    <td style="padding:8px 0;width:25%;text-align:center;">
                      <p style="margin:0;font-size:24px;font-weight:700;color:#10b981;">${stats.clicks.toLocaleString()}</p>
                      <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Clicks</p>
                    </td>
                    <td style="padding:8px 0;width:25%;text-align:center;">
                      <p style="margin:0;font-size:24px;font-weight:700;color:#06b6d4;">${stats.orders.toLocaleString()}</p>
                      <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Orders</p>
                    </td>
                    <td style="padding:8px 0;width:25%;text-align:center;">
                      <p style="margin:0;font-size:24px;font-weight:700;color:#f59e0b;">${stats.conversionRate}%</p>
                      <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Conv.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${wowRows}
      ${daySection}
      ${funnelSection}
      ${topProductsSection}
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/dashboard?utm_source=brevo&utm_medium=email&utm_campaign=weekly-analytics" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">View Full Dashboard</a>
        </td>
      </tr>
  `);

  const { subject, variant } = pickSubject([
    `Your ${storeName} weekly analytics — ${stats.visits} visits, ${stats.orders} orders`,
    `${storeName}'s week in review: ${stats.visits} visitors, ${stats.orders} orders`,
    `Weekly report: ${storeName} had ${stats.visits} visits this week`,
  ]);

  return sendBrevoEmail({
    to: [{ email }],
    subject,
    htmlContent: html,
    tags: ["marketing", "weekly_analytics_summary", variant],
    templateSlug: "weekly-analytics-summary",
    templateVars: {
      greeting,
      store_name: storeName,
      store_slug: storeSlug,
      visits: String(stats.visits),
      clicks: String(stats.clicks),
      orders: String(stats.orders),
      conversion_rate: stats.conversionRate,
      best_day: stats.bestDay?.day || "",
      worst_day: stats.worstDay?.day || "",
      platform_name: platformName,
      app_url: APP_URL,
    },
  });
}

// ─── Monthly Analytics Summary ───────────────────────────────────────────────

export async function sendMonthlyAnalyticsSummary({
  email,
  name,
  storeName,
  storeSlug,
  month,
  stats,
}: {
  email: string;
  name?: string;
  storeName: string;
  storeSlug: string;
  month: string; // e.g. "August 2026"
  stats: {
    visits: number;
    clicks: number;
    orders: number;
    conversionRate: string;
    monthOverMonth?: {
      visits: { current: number; previous: number; trend?: number };
      clicks: { current: number; previous: number; trend?: number };
      orders: { current: number; previous: number; trend?: number };
    };
    bestDay?: { day: string; avgVisits: number } | null;
    topProducts?: Array<{ name: string; count: number }>;
  };
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  const platformName = await getPlatformName();

  const trendBadge = (trend?: number) => {
    if (trend === undefined || trend === null) return '<span style="color:#94a3b8;font-size:11px;">—</span>';
    const color = trend >= 0 ? "#10b981" : "#ef4444";
    const arrow = trend >= 0 ? "&#8593;" : "&#8595;";
    return `<span style="color:${color};font-size:11px;font-weight:600;">${arrow} ${Math.abs(trend)}%</span>`;
  };

  // MoM comparison rows
  const momRows = stats.monthOverMonth
    ? `
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0 0 8px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">vs Last Month</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.12);border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:12px 16px;font-size:13px;color:#94a3b8;">Visits</td>
              <td style="padding:12px 16px;text-align:right;font-size:14px;font-weight:600;color:#f1f5f9;">${stats.monthOverMonth.visits.current.toLocaleString()}</td>
              <td style="padding:12px 16px;text-align:right;">${trendBadge(stats.monthOverMonth.visits.trend)}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;color:#94a3b8;border-top:1px solid rgba(255,255,255,0.06);">Channel Clicks</td>
              <td style="padding:12px 16px;text-align:right;font-size:14px;font-weight:600;color:#f1f5f9;border-top:1px solid rgba(255,255,255,0.06);">${stats.monthOverMonth.clicks.current.toLocaleString()}</td>
              <td style="padding:12px 16px;text-align:right;border-top:1px solid rgba(255,255,255,0.06);">${trendBadge(stats.monthOverMonth.clicks.trend)}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;color:#94a3b8;border-top:1px solid rgba(255,255,255,0.06);">Orders</td>
              <td style="padding:12px 16px;text-align:right;font-size:14px;font-weight:600;color:#f1f5f9;border-top:1px solid rgba(255,255,255,0.06);">${stats.monthOverMonth.orders.current.toLocaleString()}</td>
              <td style="padding:12px 16px;text-align:right;border-top:1px solid rgba(255,255,255,0.06);">${trendBadge(stats.monthOverMonth.orders.trend)}</td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : "";

  // Best day section
  const bestDaySection = stats.bestDay
    ? `
      <tr>
        <td style="padding:0 32px 24px;">
          <div style="padding:14px 18px;background:rgba(16,185,129,0.06);border-left:3px solid #10b981;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:14px;color:#e0e0e0;line-height:1.5;"><strong style="color:#10b981;">Best day:</strong> ${stats.bestDay.day} — averaging ${stats.bestDay.avgVisits} visits</p>
          </div>
        </td>
      </tr>
    `
    : "";

  // Top products section
  const topProductsSection =
    stats.topProducts && stats.topProducts.length > 0
      ? `
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0 0 8px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Top Products This Month</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
            ${stats.topProducts
              .slice(0, 5)
              .map(
                (p, i) => `
              <tr>
                <td style="padding:10px 16px;border-bottom:${i < stats.topProducts!.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none"};">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="width:20px;height:20px;border-radius:4px;background:${i === 0 ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)"};text-align:center;line-height:20px;font-size:10px;font-weight:700;color:${i === 0 ? "#a78bfa" : "#94a3b8"};">${i + 1}</span>
                    <span style="flex:1;font-size:13px;color:#e0e0e0;">${p.name}</span>
                    <span style="font-size:12px;color:#94a3b8;">${p.count} views</span>
                  </div>
                </td>
              </tr>
            `
              )
              .join("")}
          </table>
        </td>
      </tr>
    `
      : "";

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#128202;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">${month} Analytics</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting}, here's your monthly performance summary.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.12);border-radius:12px;">
            <tr>
              <td style="padding:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;width:25%;text-align:center;">
                      <p style="margin:0;font-size:24px;font-weight:700;color:#a78bfa;">${stats.visits.toLocaleString()}</p>
                      <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Visits</p>
                    </td>
                    <td style="padding:8px 0;width:25%;text-align:center;">
                      <p style="margin:0;font-size:24px;font-weight:700;color:#10b981;">${stats.clicks.toLocaleString()}</p>
                      <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Clicks</p>
                    </td>
                    <td style="padding:8px 0;width:25%;text-align:center;">
                      <p style="margin:0;font-size:24px;font-weight:700;color:#06b6d4;">${stats.orders.toLocaleString()}</p>
                      <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Orders</p>
                    </td>
                    <td style="padding:8px 0;width:25%;text-align:center;">
                      <p style="margin:0;font-size:24px;font-weight:700;color:#f59e0b;">${stats.conversionRate}%</p>
                      <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Conv.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${momRows}
      ${bestDaySection}
      ${topProductsSection}
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/dashboard?utm_source=brevo&utm_medium=email&utm_campaign=monthly-analytics" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">View Full Dashboard</a>
        </td>
      </tr>
  `);

  const { subject, variant } = pickSubject([
    `${storeName} ${month} report — ${stats.visits} visits, ${stats.orders} orders`,
    `Your ${month} recap: ${storeName} grew with ${stats.visits} visits`,
    `${storeName}'s ${month} performance: ${stats.visits} visitors, ${stats.orders} orders`,
  ]);

  return sendBrevoEmail({
    to: [{ email }],
    subject,
    htmlContent: html,
    tags: ["marketing", "monthly_analytics_summary", variant],
    templateSlug: "monthly-analytics-summary",
    templateVars: {
      greeting,
      store_name: storeName,
      store_slug: storeSlug,
      month,
      visits: String(stats.visits),
      clicks: String(stats.clicks),
      orders: String(stats.orders),
      conversion_rate: stats.conversionRate,
      best_day: stats.bestDay?.day || "",
      platform_name: platformName,
      app_url: APP_URL,
    },
  });
}

// ─── Onboarding Checklist ───────────────────────────────────────────────────

export async function sendOnboardingChecklist({
  email,
  name,
  storeName,
  storeSlug,
}: {
  email: string;
  name?: string;
  storeName: string;
  storeSlug: string;
}) {
  const greeting = name ? `Hi ${name}` : "Hi there";
  const platformName = await getPlatformName();

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#06b6d4);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#127881;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">Your store is live!</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">Here's your setup checklist</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${greeting}, congratulations! <strong>${storeName}</strong> is now live on ${platformName}. Complete these steps to get your first order:</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.12);border-radius:12px;">
            <tr>
              <td style="padding:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;width:32px;">
                      <div style="width:24px;height:24px;border-radius:50%;background:rgba(16,185,129,0.15);text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#10b981;">&#10003;</div>
                    </td>
                    <td style="padding:8px 0 8px 12px;">
                      <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;">Store created</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Your store URL is live and shareable.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;width:32px;">
                      <div style="width:24px;height:24px;border-radius:50%;background:rgba(168,85,247,0.15);text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#a78bfa;">1</div>
                    </td>
                    <td style="padding:8px 0 8px 12px;">
                      <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;">Add your first product</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Upload a clear photo, set a price, and write a short description. Stores with 5+ products get 3x more orders.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;width:32px;">
                      <div style="width:24px;height:24px;border-radius:50%;background:rgba(168,85,247,0.15);text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#a78bfa;">2</div>
                    </td>
                    <td style="padding:8px 0 8px 12px;">
                      <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;">Add your logo & description</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">A professional logo and bio builds trust with customers.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;width:32px;">
                      <div style="width:24px;height:24px;border-radius:50%;background:rgba(168,85,247,0.15);text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#a78bfa;">3</div>
                    </td>
                    <td style="padding:8px 0 8px 12px;">
                      <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;">Share your store link</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Put it in your WhatsApp bio, Instagram bio, and tell 5 friends today.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;width:32px;">
                      <div style="width:24px;height:24px;border-radius:50%;background:rgba(168,85,247,0.15);text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#a78bfa;">4</div>
                    </td>
                    <td style="padding:8px 0 8px 12px;">
                      <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;">Test the WhatsApp checkout</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Add a product to cart and click "Order on WhatsApp" to see how customers will order from you.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <div style="padding:16px 20px;background:rgba(6,182,212,0.06);border-left:3px solid #06b6d4;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:14px;color:#e0e0e0;line-height:1.5;"><strong style="color:#06b6d4;">Pro tip:</strong> Vendors who complete all 4 steps within 24 hours get 5x more orders in their first week than those who skip steps.</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/${storeSlug}?utm_source=brevo&utm_medium=email&utm_campaign=onboarding-checklist" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">View Your Store</a>
        </td>
      </tr>
  `);

  const { subject, variant } = pickSubject([
    `${storeName} is live! Here's your setup checklist`,
    `Congrats! ${storeName} is now live on ${platformName}`,
    `Your store is ready — 4 steps to get your first order`,
  ]);

  return sendBrevoEmail({
    to: [{ email }],
    subject,
    htmlContent: html,
    tags: ["marketing", "onboarding_checklist", variant],
    templateSlug: "onboarding-checklist",
    templateVars: {
      greeting,
      store_name: storeName,
      store_slug: storeSlug,
      platform_name: platformName,
      app_url: APP_URL,
    },
  });
}

// ─── Review moderation emails ────────────────────────────────────────────────
// Notifies a store owner when the admin team hides or deletes a review
// about their store.

export async function sendReviewModerationEmail({
  email,
  storeName,
  storeSlug,
  reviewerName,
  reviewSnippet,
  action,
}: {
  email: string;
  storeName: string;
  storeSlug: string;
  reviewerName: string;
  reviewSnippet?: string;
  action: "hidden" | "deleted";
}) {
  const platformName = await getPlatformName();
  const isHidden = action === "hidden";
  const headline = isHidden
    ? "A review was hidden from your store"
    : "A review was removed from your store";
  const body = isHidden
    ? `A review from <strong>${reviewerName}</strong> about <strong>${storeName}</strong> was hidden by our moderation team. It is no longer visible to customers, but you can still see it and reach out to appeal.`
    : `A review from <strong>${reviewerName}</strong> about <strong>${storeName}</strong> was removed by our moderation team for violating our community guidelines.`;

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#ef4444,#f59e0b);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#9888;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">${headline}</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${storeName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">${body}</p>
        </td>
      </tr>
      ${reviewSnippet ? `
      <tr>
        <td style="padding:0 32px 24px;">
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #ef4444;border-radius:8px;padding:14px 16px;">
            <p style="margin:0 0 6px 0;font-size:12px;color:#94a3b8;"><strong style="color:#f1f5f9;">${reviewerName}</strong> said:</p>
            <p style="margin:0;font-size:13px;color:#e0e0e0;font-style:italic;">&ldquo;${reviewSnippet.slice(0, 300)}${reviewSnippet.length > 300 ? "…" : ""}&rdquo;</p>
          </div>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/${storeSlug}?utm_source=brevo&utm_medium=email&utm_campaign=review_moderation" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">View Your Store</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: `${isHidden ? "Hidden" : "Removed"} review on ${storeName} — ${platformName}`,
    htmlContent: html,
    tags: ["moderation", "review", action],
    templateSlug: "review-moderation",
    templateVars: {
      store_name: storeName,
      store_slug: storeSlug,
      reviewer_name: reviewerName,
      review_snippet: reviewSnippet || "",
      platform_name: platformName,
      app_url: APP_URL,
    },
  });
}

// Notifies a review author when the store owner posts a public reply.
export async function sendReviewReplyNotification({
  email,
  authorName,
  storeName,
  storeSlug,
  reply,
}: {
  email: string;
  authorName?: string;
  storeName: string;
  storeSlug: string;
  reply: string;
}) {
  const platformName = await getPlatformName();
  const greeting = authorName ? authorName : "there";

  const html = emailWrapper(`
      <tr>
        <td style="padding:32px 32px 24px;text-align:center;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#06b6d4,#a855f7);margin:0 auto 16px;line-height:48px;text-align:center;">
            <span style="color:white;font-size:20px;">&#128172;</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;">${storeName} replied to your review</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#94a3b8;">${platformName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;color:#e0e0e0;line-height:1.6;">Hi ${greeting},</p>
          <p style="margin:12px 0 0;font-size:15px;color:#e0e0e0;line-height:1.6;"><strong>${storeName}</strong> responded to your review:</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <div style="background:rgba(6,182,212,0.05);border:1px solid rgba(6,182,212,0.15);border-left:3px solid #06b6d4;border-radius:8px;padding:14px 16px;">
            <p style="margin:0;font-size:13px;color:#e0e0e0;font-style:italic;line-height:1.6;">&ldquo;${reply.slice(0, 300)}${reply.length > 300 ? "…" : ""}&rdquo;</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;text-align:center;">
          <a href="${APP_URL}/${storeSlug}?utm_source=brevo&utm_medium=email&utm_campaign=review_reply" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">View ${storeName}</a>
        </td>
      </tr>
  `);

  return sendBrevoEmail({
    to: [{ email }],
    subject: `${storeName} replied to your review on ${platformName}`,
    htmlContent: html,
    tags: ["reviews", "reply"],
    templateSlug: "review-reply-notification",
    templateVars: {
      store_name: storeName,
      store_slug: storeSlug,
      reply,
      platform_name: platformName,
      app_url: APP_URL,
    },
  });
}
