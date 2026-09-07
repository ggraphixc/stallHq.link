import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  getThemeMode, setThemeMode, useThemeStyles, Colors, FontSize, Spacing, BorderRadius,
  type ThemeMode,
} from "../lib/theme";
import { Sun, Moon, MonitorSmartphone } from "lucide-react-native";

const OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: "system", label: "System", icon: <MonitorSmartphone size={14} color={Colors.textSecondary} /> },
  { value: "light", label: "Light", icon: <Sun size={14} color={Colors.amber} /> },
  { value: "dark", label: "Dark", icon: <Moon size={14} color={Colors.purple} /> },
];

/** Appearance selector — System follows the phone's light/dark setting. */
export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(getThemeMode());
  const styles = useThemeStyles(makeStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Appearance</Text>
      <Text style={styles.sub}>System follows your phone's light/dark setting</Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = mode === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => { setThemeMode(opt.value); setMode(opt.value); }}
              activeOpacity={0.7}
            >
              {opt.icon}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  wrap: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  label: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.03 },
  sub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, marginBottom: Spacing.sm },
  row: { flexDirection: "row", gap: Spacing.sm },
  chip: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
  },
  chipActive: { backgroundColor: Colors.purpleDim, borderColor: Colors.borderGlow },
  chipText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary },
  chipTextActive: { color: Colors.purple },
});