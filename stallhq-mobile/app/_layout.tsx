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
import { useAuth } from "../lib/auth";
import { NetworkStatus } from "../components/NetworkStatus";
import { initNetworkListener } from "../lib/offlineCache";

function ThemeBridge() {
  const scheme = useColorScheme();
  useThemeVersion();
  useEffect(() => {
    setSystemScheme(scheme === "dark" ? "dark" : scheme === "light" ? "light" : null);
  }, [scheme]);
  useEffect(() => {
    initTheme();
    initNetworkListener();
  }, []);
  return <StatusBar style={getIsDark() ? "light" : "dark"} />;
}

/** Must be a child of AuthProvider so useAuth() receives a real session. */
function PushBridge() {
  const { loading: authLoading, user: authUser } = useAuth();
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const { setupPushRegistration, onNotificationReceived, onNotificationTapped } = await import("../lib/notify");
        if (cancelled) return;
        setupPushRegistration();
        onNotificationReceived(() => {});
        onNotificationTapped();
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [authLoading, authUser?.id]);
  return null;
}

export default function RootLayout() {
  useThemeVersion();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <AlertProvider>
            <ThemeBridge />
            <PushBridge />
            <NetworkStatus />
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
