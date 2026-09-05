import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";
import { Colors } from "../lib/theme";
import { AlertProvider } from "../components/ui/CustomAlert";

export default function RootLayout() {
  // Register for push notifications on app start (lazy-loaded)
  useEffect(() => {
    (async () => {
      try {
        const { registerForPushNotifications, onNotificationReceived, onNotificationTapped } = await import("../lib/notify");
        registerForPushNotifications();
        onNotificationReceived(() => {});
        onNotificationTapped(() => {});
      } catch {}
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <AlertProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.bg },
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(vendor)" />
              <Stack.Screen name="(customer)" />
            </Stack>
          </AlertProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
