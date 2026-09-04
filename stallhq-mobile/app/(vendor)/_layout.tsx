import { Stack, Redirect } from "expo-router";
import { Colors } from "../../lib/theme";
import { useAuth } from "../../lib/auth";
import { BrandLoader } from "../../components/BrandLoader";

export default function VendorLayout() {
  const { session, loading } = useAuth();

  // Session guard — vendors must be signed in. Prevents screens from sitting
  // on a forever "Loading..." state after sign-out.
  if (loading) return <BrandLoader label="Opening stallHq" />;
  if (!session) return <Redirect href="/(auth)/select-role" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="products/[id]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="products/new"
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="orders/[id]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="settings"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="promo-cards"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="browse"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="analytics/[metric]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="monitoring"
        options={{ animation: "slide_from_right" }}
      />
    </Stack>
  );
}
