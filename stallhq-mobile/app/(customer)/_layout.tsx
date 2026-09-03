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
    </Stack>
  );
}
