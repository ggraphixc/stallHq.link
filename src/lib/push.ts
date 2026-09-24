import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const PUSH_TIMEOUT_MS = 15_000;
const PUSH_BATCH_SIZE = 50;
/** Hard cap on tokens dispatched per room-message broadcast. */
export const ROOM_PUSH_TOKEN_CAP = 50;

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

let adminClient: SupabaseClient | null = null;

/** Lazy service-role client — missing env must not crash module import. */
function getAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[push] missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }
  adminClient = createClient(url, key);
  return adminClient;
}

function makeAbortSignal(): AbortSignal | undefined {
  try {
    const sig = (AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }).timeout;
    if (typeof sig === "function") return sig.call(AbortSignal, PUSH_TIMEOUT_MS);
  } catch {}
  return undefined;
}

/**
 * Send an Expo push notification to a list of device tokens.
 * Batches up to 50 tokens per request, checks per-token tickets, and prunes
 * tokens Expo reports as DeviceNotRegistered. Never throws.
 * Returns the number of messages dispatched.
 */
export async function sendPushToTokens(
  tokens: string[],
  payload: PushPayload
): Promise<number> {
  try {
    const unique = [
      ...new Set(tokens.filter((t): t is string => typeof t === "string" && t.trim().length > 0)),
    ];
    if (!unique.length) return 0;

    const title = (payload.title || "Notification").slice(0, 100);
    const bodyText = (payload.body || "").slice(0, 400);
    const data = payload.data ?? {};

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.EXPO_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    let sent = 0;
    const deadTokens: string[] = [];
    const failures: { token: string; reason: string }[] = [];

    for (let i = 0; i < unique.length; i += PUSH_BATCH_SIZE) {
      const batch = unique.slice(i, i + PUSH_BATCH_SIZE);
      const messages = batch.map((token) => ({
        to: token,
        title,
        body: bodyText,
        sound: "default",
        data,
      }));

      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers,
          body: JSON.stringify(messages),
          signal: makeAbortSignal(),
        });

        let json: unknown = null;
        try {
          json = await res.json();
        } catch {}

        if (!res.ok) {
          const reason = `${res.status} ${JSON.stringify(json).slice(0, 200)}`;
          for (const token of batch) {
            failures.push({ token: token.slice(0, 16) + "…", reason });
          }
          console.error("[push] Expo rejected batch:", reason);
          continue;
        }

        const parsed = json as { data?: unknown } | null;
        const tickets: Array<{
          status?: string;
          message?: string;
          details?: { error?: string };
        }> = Array.isArray(parsed?.data)
          ? (parsed.data as Array<{
              status?: string;
              message?: string;
              details?: { error?: string };
            }>)
          : parsed?.data
            ? [parsed.data as { status?: string; message?: string; details?: { error?: string } }]
            : [];

        if (!tickets.length) {
          // HTTP OK but no parseable tickets — count as dispatched (legacy behavior).
          sent += batch.length;
          continue;
        }

        tickets.forEach((ticket, idx) => {
          const token = batch[idx] ?? "";
          if (ticket?.status === "ok") {
            sent++;
            return;
          }
          const reason =
            ticket?.message || ticket?.details?.error || "unknown Expo ticket error";
          failures.push({ token: token.slice(0, 16) + "…", reason });
          console.error(
            "[push] ticket error for token",
            token.slice(0, 8) + "…:",
            reason
          );
          if (ticket?.details?.error === "DeviceNotRegistered" && token) {
            deadTokens.push(token);
          }
        });
      } catch (err) {
        const reason = String(err);
        for (const token of batch) {
          failures.push({ token: token.slice(0, 16) + "…", reason });
        }
        console.error("[push] batch send failed:", err);
      }
    }

    if (deadTokens.length) {
      const admin = getAdmin();
      if (admin) {
        void Promise.resolve(
          admin
            .from("push_tokens")
            .delete()
            .in("token", deadTokens)
        ).then(({ error }) => {
          if (error) console.warn("[push] dead-token cleanup failed:", error.message);
        }).catch(() => {});
      }
    }

    if (failures.length) {
      console.warn("[push] push send summary:", {
        sent,
        failed: failures.length,
        failedTokens: failures.map((f) => f.token),
        reasons: failures.map((f) => f.reason),
      });
    }
    return sent;
  } catch (err) {
    console.error("[push] sendPushToTokens unexpected error:", err);
    return 0;
  }
}

/** Push to every device token belonging to the given user ids. Never throws. */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<number> {
  try {
    const ids = [...new Set(userIds.filter((id): id is string => typeof id === "string" && id.length > 0))];
    if (!ids.length) return 0;
    const admin = getAdmin();
    if (!admin) return 0;
    const { data: tokens, error } = await admin
      .from("push_tokens")
      .select("token")
      .in("user_id", ids);
    if (error) {
      console.error("[push] token lookup failed:", error.message);
      return 0;
    }
    if (!tokens?.length) return 0;
    return await sendPushToTokens(tokens.map((t) => t.token), payload);
  } catch (err) {
    console.error("[push] sendPushToUsers error:", err);
    return 0;
  }
}

export interface RoomPushInput {
  roomId: string;
  roomName?: string | null;
  senderId: string;
  senderName?: string | null;
  content: string;
  memberIds: string[];
}

/**
 * Broadcast a global-chat room message to members (sender excluded, muted
 * members skipped, capped at ROOM_PUSH_TOKEN_CAP tokens). Never throws.
 */
export async function sendRoomMessagePush(input: RoomPushInput): Promise<number> {
  try {
    const admin = getAdmin();
    if (!admin) return 0;

    const recipients = [
      ...new Set(
        input.memberIds.filter(
          (id): id is string => typeof id === "string" && id.length > 0 && id !== input.senderId
        ),
      ),
    ];
    if (!recipients.length) return 0;

    const { data: mutedRows } = await admin
      .from("room_notifications")
      .select("user_id")
      .eq("room_id", input.roomId)
      .eq("is_muted", true);
    const muted = new Set((mutedRows ?? []).map((r) => r.user_id));
    const active = recipients.filter((id) => !muted.has(id));
    if (!active.length) return 0;

    const { data: tokenRows, error } = await admin
      .from("push_tokens")
      .select("token")
      .in("user_id", active)
      .limit(ROOM_PUSH_TOKEN_CAP);
    if (error) {
      console.error("[push] room token lookup failed:", error.message);
      return 0;
    }
    if (!tokenRows?.length) return 0;

    const trimmed = (input.content || "").trim().slice(0, 120);
    const sender = (input.senderName || "").trim();
    const bodyText = sender ? `${sender}: ${trimmed}`.slice(0, 140) : trimmed;

    return await sendPushToTokens(tokenRows.map((t) => t.token), {
      title: (input.roomName || "New message").slice(0, 100),
      body: bodyText,
      data: { screen: "global-chat", roomId: input.roomId },
    });
  } catch (err) {
    console.error("[push] sendRoomMessagePush error:", err);
    return 0;
  }
}

export interface OrderStatusPushInput {
  orderId: string;
  status: string;
  storeName?: string | null;
  customerId?: string | null;
  customerEmail?: string | null;
}

/**
 * Push the customer an order-status update. Resolves the account via
 * customer_id, falling back to a customer_email → auth-user lookup.
 * Honors notification_preferences.order_updates. Never throws.
 */
export async function sendOrderStatusPush(input: OrderStatusPushInput): Promise<number> {
  try {
    const admin = getAdmin();
    if (!admin) return 0;

    let userId: string | null =
      typeof input.customerId === "string" && input.customerId ? input.customerId : null;

    if (!userId && input.customerEmail) {
      const email = input.customerEmail.toLowerCase();
      try {
        const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
        userId = data?.users.find((u) => (u.email || "").toLowerCase() === email)?.id ?? null;
      } catch (err) {
        console.warn("[push] email→user lookup failed:", err);
      }
    }
    if (!userId) return 0;

    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("order_updates")
      .eq("user_id", userId)
      .maybeSingle();
    if (prefs && prefs.order_updates === false) return 0;

    const label = input.status ? input.status.charAt(0).toUpperCase() + input.status.slice(1) : "updated";
    const bodyText = input.storeName
      ? `Your order from ${input.storeName} is now ${label}`
      : `Your order is now ${label}`;

    return await sendPushToUsers([userId], {
      title: "Order update",
      body: bodyText,
      data: { screen: "orders", orderId: input.orderId, status: input.status, userId },
    });
  } catch (err) {
    console.error("[push] sendOrderStatusPush error:", err);
    return 0;
  }
}

export type PushAudience = "all" | "customers" | "vendors" | "trial" | "paid";

/** Resolve device tokens for a broadcast audience. */
export async function resolveAudienceTokens(
  audience: PushAudience
): Promise<string[]> {
  const admin = getAdmin();
  if (!admin) return [];
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
  const admin = getAdmin();
  if (!admin) return;
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
  const admin = getAdmin();
  if (!admin) return [];
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
