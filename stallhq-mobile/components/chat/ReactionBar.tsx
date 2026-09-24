import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useThemeStyles, Colors, FontSize, BorderRadius } from "../../lib/theme";
import type { ReactionSummary } from "../../lib/globalChat";

type Props = {
  reactions?: ReactionSummary[string] | null;
  mineId?: string;
  onToggle?: (emoji: string) => void;
};

export function ReactionBar({ reactions, mineId, onToggle }: Props) {
  const styles = useThemeStyles(makeStyles);
  if (!reactions || reactions.length === 0) return null;

  return (
    <View style={styles.row}>
      {reactions.map((r) => {
        const mine = mineId ? r.userIds.includes(mineId) : false;
        return (
          <Text
            key={r.emoji}
            onPress={() => onToggle?.(r.emoji)}
            style={[styles.pill, mine && styles.pillMine]}
            suppressHighlighting
          >
            {r.emoji} {r.userIds.length}
          </Text>
        );
      })}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      marginTop: 4,
    },
    pill: {
      fontSize: FontSize.xs,
      color: Colors.textSecondary,
      backgroundColor: Colors.bgElevated,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.full,
      paddingHorizontal: 7,
      paddingVertical: 2,
      overflow: "hidden",
    },
    pillMine: {
      color: Colors.purple,
      borderColor: Colors.borderGlow,
      backgroundColor: Colors.purpleDim,
      fontWeight: "700",
    },
  });
