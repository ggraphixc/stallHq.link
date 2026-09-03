import { Stack } from "expo-router";
import { Colors } from "../../lib/theme";

export default function VendorLayout() {
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
    </Stack>
  );
}
