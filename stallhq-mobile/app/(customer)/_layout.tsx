import { Stack } from "expo-router";
import { Colors } from "../../lib/theme";

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="store/[slug]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="product/[id]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="become-vendor"
        options={{ animation: "slide_from_right" }}
      />
    </Stack>
  );
}
