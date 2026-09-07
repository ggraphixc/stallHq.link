import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";
import {
  Colors, getIsDark, initTheme, setSystemScheme, useThemeVersion,
} from "../lib/theme";
import { AlertProvider } from "../components/ui/CustomAlert";

function ThemeBridge() {
  const scheme = useColorScheme();
  useThemeVersion();
  useEffect(() => {
    setSystemScheme(scheme === "dark" ? "dark" : scheme === "light" ? "light" : null);
  }, [scheme]);
  useEffect(() => {
    initTheme();
  }, []);
  return <StatusBar style={getIsDark() ? "light" : "dark"} />;
}

export default function RootLayout() {
  useThemeVersion();

  // Register for push notifications on app start (lazy-loaded)
  useEffect(() => {
    (async () => {
      try {
        const { setupPushRegistration, onNotificationReceived, onNotificationTapped } = await import("../lib/notify");
        setupPushRegistration();
        onNotificationReceived(() => {});
        onNotificationTapped();
      } catch {}
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <AlertProvider>
            <ThemeBridge />
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
