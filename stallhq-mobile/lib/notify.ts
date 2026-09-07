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

    if (finalStatus !== "granted") return null;

    const tokenData = await N.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    // Save to Supabase (upsert by token keeps the latest user_id)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("push_tokens").upsert(
        {
          user_id: user.id,
          token: pushToken,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      );
    }

    // Android channel
    if (Platform.OS === "android") {
      await N.setNotificationChannelAsync("default", {
        name: "Default",
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
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
  registerForPushNotifications();
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      registerForPushNotifications();
    }
  });
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
    // Vendors land on their orders; customers on their order history.
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", notification.request?.content?.data?.userId ?? "")
      .maybeSingle();
    if (store) {
      router.push("/(vendor)/(tabs)/orders");
    } else {
      router.push("/(customer)/(tabs)/orders");
    }
    return;
  }

  // Default: open the tab shell (bell overlay is one tap away)
  router.push("/(customer)/(tabs)");
}

/**
 * Subscribe to notification tap events — navigates to the relevant screen.
 */
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