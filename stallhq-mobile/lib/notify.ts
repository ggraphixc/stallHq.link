import { Platform } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { WEB_API_URL } from "./auth";

let Notifications: typeof import("expo-notifications") | null = null;
let lastPushToken: string | null = null;
const TOKEN_CACHE_KEY = "stallhq:lastPushToken";
const REREGISTER_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12h

async function getNotifications() {
  if (!Notifications) {
    Notifications = await import("expo-notifications");
    Notifications!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
  return Notifications;
}

function isValidUserId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id !== "";
}

async function ensureAndroidChannel(N: typeof import("expo-notifications")) {
  if (Platform.OS !== "android") return;
  try {
    await N.setNotificationChannelAsync("default", {
      name: "Default",
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  } catch (chErr) {
    console.warn("[notify] could not set notification channel:", chErr);
  }
}

/**
 * Return the last known Expo push token (from cache or AsyncStorage).
 * Used by signOut to unregister this device's token only.
 */
export async function getStoredPushToken(): Promise<string | null> {
  if (lastPushToken) return lastPushToken;
  try {
    lastPushToken = await AsyncStorage.getItem(TOKEN_CACHE_KEY);
  } catch {
    lastPushToken = null;
  }
  return lastPushToken;
}

/**
 * Request push notification permission and return the Expo push token, or null if denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const N = await getNotifications();
    await ensureAndroidChannel(N);

    const { status: existing } = await N.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await N.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("[notify] permission denied/not granted:", finalStatus);
      return null;
    }

    const tokenData = await N.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    if (!pushToken || pushToken.length === 0) {
      console.warn("[notify] empty push token — Expo push service may not be available");
      return null;
    }

    lastPushToken = pushToken;
    try {
      await AsyncStorage.setItem(TOKEN_CACHE_KEY, pushToken);
    } catch {
      // non-critical
    }

    // Skip network work if we already registered this exact token recently
    // (setupPushRegistration also throttles via interval, but this guards direct calls).
    console.log("[notify] acquired push token:", pushToken.slice(0, 20) + "…");

    // Save to Supabase (upsert by token keeps the latest user_id)
    // Only persist when we actually have a valid user.
    const { data: { user } } = await supabase.auth.getUser();
    if (isValidUserId(user?.id)) {
      try {
        await supabase.from("push_tokens").upsert(
          {
            user_id: user.id,
            token: pushToken,
            platform: Platform.OS,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "token" }
        );
        console.log("[notify] token saved to Supabase for user:", user.id.slice(0, 12) + "…");

        // Also register with the web API for cross-platform push delivery
        try {
          await fetch(`${WEB_API_URL}/api/push/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-access-token": (await supabase.auth.getSession()).data.session?.access_token || "",
            },
            body: JSON.stringify({ token: pushToken, platform: Platform.OS }),
          });
        } catch (webRegErr) {
          console.warn("[notify] web API registration failed (non-critical):", webRegErr);
        }
      } catch (upsertErr) {
        console.warn("[notify] failed to upsert push token:", upsertErr);
      }
    } else {
      console.log("[notify] no valid user — token retained in-memory until sign-in");
    }

    return pushToken;
  } catch (err) {
    console.warn("[notify] registration failed:", err);
    return null;
  }
}

let setupDone = false;
let reregisterTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Register on launch and re-register whenever the signed-in user changes,
 * so tokens always point at the current account. Idempotent — safe to call once.
 */
export function setupPushRegistration(): void {
  if (setupDone) return;
  setupDone = true;

  // Re-register when the user signs in (skip redundant TOKEN_REFRESHED churn).
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user && isValidUserId(session.user.id) && event !== "TOKEN_REFRESHED") {
      await registerForPushNotifications();
    }
  });

  // Also re-register on app launch if the user is already signed in.
  registerForPushNotifications();

  // Periodic re-register keeps server-side tokens fresh (e.g. token rotation).
  reregisterTimer = setInterval(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isValidUserId(session.user.id)) {
        registerForPushNotifications();
      }
    });
  }, REREGISTER_INTERVAL_MS);
}

/**
 * Subscribe to foreground notification events. Returns an unsubscribe function.
 */
export function onNotificationReceived(
  handler: (notification: any) => void
): () => void {
  let sub: any = null;
  getNotifications().then((N) => {
    sub = N.addNotificationReceivedListener(handler);
  });
  return () => sub?.remove();
}

async function isCurrentUserVendor(userId: string): Promise<boolean> {
  if (!isValidUserId(userId)) return false;
  try {
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    return !!store;
  } catch {
    return false;
  }
}

async function navigateForNotification(notification: any): Promise<void> {
  const data = notification?.request?.content?.data ?? {};
  const screen = data.screen;

  if (screen === "orders") {
    if (await isCurrentUserVendor(data.userId)) {
      router.push("/(vendor)/(tabs)/orders");
    } else {
      router.push("/(customer)/(tabs)/orders");
    }
    return;
  }

  if (screen === "chat" && typeof data.conversationId === "string" && data.conversationId) {
    // data.userId is the *recipient* — the current user after tap.
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id ?? (isValidUserId(data.userId) ? data.userId : "");
    if (uid && (await isCurrentUserVendor(uid))) {
      router.push(`/(vendor)/chat/${data.conversationId}`);
    } else {
      router.push(`/(customer)/chat/${data.conversationId}`);
    }
    return;
  }

  if (screen === "global-chat" && typeof data.roomId === "string" && data.roomId) {
    router.push(`/(customer)/chat/global/${data.roomId}`);
    return;
  }

  router.push("/(customer)/(tabs)");
}

export function onNotificationTapped(
  handler?: (response: any) => void
): () => void {
  let sub: any = null;
  getNotifications().then((N) => {
    sub = N.addNotificationResponseReceivedListener((response) => {
      handler?.(response);
      navigateForNotification(response.notification).catch(() => {});
    });
  });
  return () => sub?.remove();
}
