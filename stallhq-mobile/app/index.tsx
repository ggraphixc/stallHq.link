import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "../lib/theme";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={Colors.purple} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(vendor)/(tabs)" />;
  }

  return <Redirect href="/(auth)/select-role" />;
}
