import { Platform } from "react-native";
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

    // Save to Supabase
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

/**
 * Subscribe to notification tap events. Returns an unsubscribe function.
 */
export function onNotificationTapped(
  handler: (response: any) => void
): () => void {
  let sub: any = null;
  getNotifications().then((N) => {
    sub = N.addNotificationResponseReceivedListener(handler);
  });
  return () => sub?.remove();
}
