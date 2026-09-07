import { Platform } from "react-native";
import { router } from "expo-router";
import { supabase } from "./supabase";

let Notifications: typeof import("expo-notifications") | null = null;

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

/**
 * Request push notification permission and return the Expo push token, or null if denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const N = await getNotifications();
    const { status: existing } = await N.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await N.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("[notify] permission not granted:", finalStatus);
      return null;
    }

    const tokenData = await N.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    if (!pushToken || pushToken.length === 0) {
      console.warn("[notify] empty push token — Expo push service may not be available");
      return null;
    }

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
      } catch (upsertErr) {
        console.warn("[notify] failed to upsert push token:", upsertErr);
      }
    } else {
      console.log("[notify] no valid user — token retained in-memory until sign-in");
    }

    // Android channel
    if (Platform.OS === "android") {
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

    return pushToken;
  } catch (err) {
    console.warn("[notify] registration failed:", err);
    return null;
  }
}

/**
 * Register on launch and re-register whenever the signed-in user changes,
 * so tokens always point at the current account.
 */
export function setupPushRegistration(): void {
  // Re-register when the user signs in (lazy — uses a real, non-empty user id).
  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user && isValidUserId(session.user.id)) {
      await registerForPushNotifications();
    }
  });

  // Also re-register on app launch if the user is already signed in.
  registerForPushNotifications();
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

async function navigateForNotification(notification: any): Promise<void> {
  const data = notification?.request?.content?.data ?? {};
  const screen = data.screen;

  if (screen === "orders") {
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", data.userId ?? "")
      .maybeSingle();
    if (store) {
      router.push("/(vendor)/(tabs)/orders");
    } else {
      router.push("/(customer)/(tabs)/orders");
    }
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