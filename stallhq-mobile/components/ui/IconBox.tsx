import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BorderRadius, Colors } from "../../lib/theme";

interface IconBoxProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  accent: "purple" | "green" | "cyan" | "amber" | "red" | "blue";
  style?: ViewStyle;
}

const sizes = {
  sm: { width: 28, height: 28, borderRadius: BorderRadius.sm },
  md: { width: 36, height: 36, borderRadius: BorderRadius.md },
  lg: { width: 48, height: 48, borderRadius: BorderRadius.lg },
  xl: { width: 64, height: 64, borderRadius: BorderRadius.xl },
};

function getGradientColors(accent: string): [string, string] {
  switch (accent) {
    case "purple": return [Colors.borderGlow, "rgba(6,182,212,0.12)"];
    case "green": return ["rgba(16,185,129,0.2)", "rgba(6,182,212,0.12)"];
    case "cyan": return ["rgba(6,182,212,0.2)", "rgba(16,185,129,0.12)"];
    case "amber": return ["rgba(245,158,11,0.2)", "rgba(239,68,68,0.12)"];
    case "red": return ["rgba(239,68,68,0.2)", "rgba(245,158,11,0.12)"];
    case "blue": return ["rgba(59,130,246,0.2)", "rgba(6,182,212,0.12)"];
    default: return [Colors.borderGlow, "rgba(6,182,212,0.12)"];
  }
}

export function IconBox({ children, size = "md", accent, style }: IconBoxProps) {
  const s = sizes[size];
  const colors = getGradientColors(accent);

  return (
    <LinearGradient
      colors={[colors[0], colors[1]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s, { justifyContent: "center", alignItems: "center" }, style]}
    >
      {children}
    </LinearGradient>
  );
}
