import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../lib/theme";

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ("top" | "bottom" | "left" | "right")[];
  withHeader?: boolean;
}

export function Screen({ children, style, edges, withHeader = false }: ScreenProps) {
  return (
    <SafeAreaView
      style={[styles.screen, style]}
      edges={edges ?? (withHeader ? ["top", "bottom"] : ["top", "bottom", "left", "right"])}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
