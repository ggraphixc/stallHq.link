import React, { useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import {
  Archive,
  ArchiveRestore,
  Ban,
  Bell,
  BellOff,
  Trash2,
} from "lucide-react-native";
import { useThemeStyles, Colors } from "../../lib/theme";

type ActionIcon = React.ElementType;

type Action = {
  key: string;
  label: string;
  color: string;
  icon: ActionIcon;
  onPress: () => void;
};

export type SwipeableRoomRowProps = {
  children: React.ReactNode;
  /** Card style for the pressable row content. */
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onMute?: () => void;
  onUnmute?: () => void;
  onBlock?: () => void;
  onUnblock?: () => void;
  onDelete?: () => void;
  isArchived?: boolean;
  isMuted?: boolean;
  isBlocked?: boolean;
  /** Label for the right-side destructive action (default "Delete"). */
  deleteLabel?: string;
};

/**
 * WhatsApp-style swipeable wrapper for chat list rows.
 * Swipe right → Archive / Mute / Block. Swipe left → Delete.
 * Any action closes the row, then runs its callback.
 */
export function SwipeableRoomRow({
  children,
  style,
  onPress,
  onArchive,
  onUnarchive,
  onMute,
  onUnmute,
  onBlock,
  onUnblock,
  onDelete,
  isArchived,
  isMuted,
  isBlocked,
  deleteLabel = "Delete",
}: SwipeableRoomRowProps) {
  const styles = useThemeStyles(makeStyles);
  const ref = useRef<Swipeable>(null);

  const run = useCallback((fn?: () => void) => {
    ref.current?.close();
    fn?.();
  }, []);

  const leftActions: Action[] = (() => {
    const actions: Action[] = [];
    if (isBlocked) {
      if (onUnblock) {
        actions.push({
          key: "unblock",
          label: "Unblock",
          color: Colors.green,
          icon: Ban,
          onPress: () => run(onUnblock),
        });
      }
    } else if (isArchived) {
      if (onUnarchive) {
        actions.push({
          key: "unarchive",
          label: "Unarchive",
          color: Colors.amber,
          icon: ArchiveRestore,
          onPress: () => run(onUnarchive),
        });
      }
    } else if (onArchive) {
      actions.push({
        key: "archive",
        label: "Archive",
        color: Colors.amber,
        icon: Archive,
        onPress: () => run(onArchive),
      });
    }

    if (isMuted) {
      if (onUnmute) {
        actions.push({
          key: "unmute",
          label: "Unmute",
          color: Colors.cyan,
          icon: BellOff,
          onPress: () => run(onUnmute),
        });
      }
    } else if (onMute) {
      actions.push({
        key: "mute",
        label: "Mute",
        color: Colors.cyan,
        icon: Bell,
        onPress: () => run(onMute),
      });
    }

    if (onBlock && !isBlocked) {
      actions.push({
        key: "block",
        label: "Block",
        color: Colors.red,
        icon: Ban,
        onPress: () => run(onBlock),
      });
    }
    return actions;
  })();

  const renderActions = (actions: Action[]) => (
    <View style={styles.actions}>
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <TouchableOpacity
            key={a.key}
            style={[styles.action, { backgroundColor: a.color }]}
            activeOpacity={0.85}
            onPress={a.onPress}
            accessibilityLabel={a.label}
          >
            <Icon size={16} color="#fff" strokeWidth={2.2} />
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const content = onPress ? (
    <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  ) : (
    <View style={style}>{children}</View>
  );

  return (
    <Swipeable
      ref={ref}
      friction={2}
      overshootFriction={8}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={leftActions.length ? () => renderActions(leftActions) : undefined}
      renderRightActions={
        onDelete
          ? () =>
              renderActions([
                {
                  key: "delete",
                  label: deleteLabel,
                  color: Colors.red,
                  icon: Trash2,
                  onPress: () => run(onDelete),
                },
              ])
          : undefined
      }
    >
      {content}
    </Swipeable>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    actions: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    action: {
      width: 72,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingHorizontal: 4,
    },
    actionLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: "#fff",
      textAlign: "center",
    },
  });
