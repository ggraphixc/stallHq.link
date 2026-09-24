import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import { Reply, Copy, Trash2, X } from "lucide-react-native";
import {
  useThemeStyles,
  Colors,
  FontSize,
  Spacing,
  BorderRadius,
  shadowLg,
} from "../../lib/theme";

export type SheetAction =
  | "reply"
  | "copy"
  | "delete-for-me"
  | "delete-for-everyone";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAction: (action: SheetAction) => void;
  onReact?: (emoji: string) => void;
  /** True when the current user authored the message. */
  isMine?: boolean;
  /** Only render "Delete for everyone" when the caller can actually do it. */
  canDeleteForEveryone?: boolean;
  messageLabel?: string;
};

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function MessageActionsSheet({
  visible,
  onClose,
  onAction,
  onReact,
  isMine,
  canDeleteForEveryone,
  messageLabel,
}: Props) {
  const styles = useThemeStyles(makeStyles);

  const run = (fn: () => void) => {
    onClose();
    setTimeout(fn, 120);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          {onReact ? (
            <View style={styles.reactionRow}>
              {REACTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={styles.reactionBtn}
                  onPress={() => run(() => onReact(e))}
                  accessibilityLabel={`React ${e}`}
                >
                  <Text style={styles.reactionEmoji}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {messageLabel ? (
            <Text style={styles.preview} numberOfLines={2}>
              {messageLabel}
            </Text>
          ) : null}

          <TouchableOpacity
            style={styles.action}
            onPress={() => run(() => onAction("reply"))}
          >
            <Reply size={18} color={Colors.purple} />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={() => run(() => onAction("copy"))}
          >
            <Copy size={18} color={Colors.textSecondary} />
            <Text style={[styles.actionText, { color: Colors.textSecondary }]}>Copy</Text>
          </TouchableOpacity>

          <View style={styles.sectionDivider} />
          <Text style={styles.sectionLabel}>Delete</Text>

          <TouchableOpacity
            style={styles.action}
            onPress={() => run(() => onAction("delete-for-me"))}
          >
            <Trash2 size={18} color={Colors.textSecondary} />
            <Text style={[styles.actionText, { color: Colors.textSecondary }]}>
              Delete for me
            </Text>
          </TouchableOpacity>

          {isMine && canDeleteForEveryone ? (
            <TouchableOpacity
              style={[styles.action, styles.destructive]}
              onPress={() => run(() => onAction("delete-for-everyone"))}
            >
              <Trash2 size={18} color={Colors.red} />
              <Text style={[styles.actionText, styles.destructiveText]}>
                Delete for everyone
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.cancel} onPress={onClose}>
            <X size={16} color={Colors.textMuted} />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: Colors.bgCard,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderTopWidth: 1,
      borderColor: Colors.borderSubtle,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl,
      paddingTop: Spacing.sm,
      ...shadowLg,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.borderMedium,
      marginBottom: Spacing.md,
    },
    reactionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.xs,
    },
    reactionBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.bgSecondary,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
    },
    reactionEmoji: { fontSize: 20 },
    preview: {
      fontSize: FontSize.xs,
      color: Colors.textMuted,
      marginBottom: Spacing.sm,
      paddingHorizontal: 4,
    },
    action: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.md + 2,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    actionText: {
      fontSize: FontSize.md,
      fontWeight: "600",
      color: Colors.text,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: Colors.borderSubtle,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    sectionLabel: {
      fontSize: FontSize.xs,
      fontWeight: "700",
      color: Colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    destructive: {
      backgroundColor: Colors.redDim,
    },
    destructiveText: {
      color: Colors.red,
    },
    cancel: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: Spacing.sm,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: Colors.bgSecondary,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
    },
    cancelText: {
      fontSize: FontSize.sm,
      fontWeight: "600",
      color: Colors.textMuted,
    },
  });
