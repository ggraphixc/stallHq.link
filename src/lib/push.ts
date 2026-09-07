import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, serviceKey);

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Send an Expo push notification to a list of device tokens.
 * Returns the number of messages dispatched.
 */
export async function sendPushToTokens(
  tokens: string[],
  payload: PushPayload
): Promise<number> {
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!unique.length) return 0;

  // Send one request per token so a bad token doesn't fail the whole batch,
  // and we can log which token failed and why.
  const failed: { token: string; reason: string }[] = [];
  let sent = 0;

  for (const token of unique) {
    const message = {
      to: token,
      title: payload.title,
      body: payload.body,
      sound: "default",
      data: payload.data ?? {},
    };

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (process.env.EXPO_ACCESS_TOKEN) {
        headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
      }
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(message),
      });
      if (!res.ok) {
        const body = await res.text();
        failed.push({ token: token.slice(0, 16) + "…", reason: `${res.status} ${body.slice(0, 200)}` });
        console.error("[push] Expo rejected token", token.slice(0, 8) + "…:", res.status, body.slice(0, 300));
        continue;
      }
      sent++;
    } catch (err) {
      failed.push({ token: token.slice(0, 16) + "…", reason: String(err) });
      console.error("[push] Expo send threw for token", token.slice(0, 8) + "…:", err);
    }
  }

  if (failed.length) {
    console.warn("[push] push send summary:", {
      sent,
      failed: failed.length,
      failedTokens: failed.map((f) => f.token),
      reasons: failed.map((f) => f.reason),
    });
  }
  return sent;
}

/** Push to every device token belonging to the given user ids. */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<number> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return 0;
  const { data: tokens } = await admin
    .from("push_tokens")
    .select("token")
    .in("user_id", ids);
  if (!tokens?.length) return 0;
  return sendPushToTokens(tokens.map((t) => t.token), payload);
}

export type PushAudience = "all" | "customers" | "vendors" | "trial" | "paid";

/** Resolve device tokens for a broadcast audience. */
export async function resolveAudienceTokens(
  audience: PushAudience
): Promise<string[]> {
  const { data: tokens } = await admin
    .from("push_tokens")
    .select("token, user_id");
  if (!tokens?.length) return [];

  if (audience === "all") return tokens.map((t) => t.token);

  const { data: stores } = await admin.from("stores").select("user_id, plan");
  const vendorIds = new Set((stores ?? []).map((s) => s.user_id));
  const trialIds = new Set(
    (stores ?? []).filter((s) => s.plan === "trial").map((s) => s.user_id)
  );
  const paidIds = new Set(
    (stores ?? []).filter((s) => s.plan && s.plan !== "trial").map((s) => s.user_id)
  );

  const filtered = tokens.filter((t) => {
    switch (audience) {
      case "customers":
        return !vendorIds.has(t.user_id);
      case "vendors":
        return vendorIds.has(t.user_id);
      case "trial":
        return trialIds.has(t.user_id);
      case "paid":
        return paidIds.has(t.user_id);
      default:
        return true;
    }
  });
  return filtered.map((t) => t.token);
}

/** Mirror a broadcast into the in-app notification bell for the recipients. */
export async function saveInAppNotifications(
  userIds: string[],
  payload: { title: string; body: string; type: string; link?: string }
): Promise<void> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return;
  const rows = ids.map((user_id) => ({
    user_id,
    title: payload.title,
    body: payload.body,
    type: payload.type || "info",
    link: payload.link ?? null,
  }));
  await admin.from("user_notifications").insert(rows);
}

/** Users who hold a token for the given audience (for in-app mirroring). */
export async function resolveAudienceUserIds(
  audience: PushAudience
): Promise<string[]> {
  const { data: tokens } = await admin
    .from("push_tokens")
    .select("user_id");
  const allIds = [...new Set((tokens ?? []).map((t) => t.user_id))];
  if (audience === "all") return allIds;

  const { data: stores } = await admin.from("stores").select("user_id, plan");
  const vendorIds = new Set((stores ?? []).map((s) => s.user_id));
  const trialIds = new Set(
    (stores ?? []).filter((s) => s.plan === "trial").map((s) => s.user_id)
  );
  const paidIds = new Set(
    (stores ?? []).filter((s) => s.plan && s.plan !== "trial").map((s) => s.user_id)
  );

  return allIds.filter((id) => {
    switch (audience) {
      case "customers":
        return !vendorIds.has(id);
      case "vendors":
        return vendorIds.has(id);
      case "trial":
        return trialIds.has(id);
      case "paid":
        return paidIds.has(id);
      default:
        return true;
    }
  });
}