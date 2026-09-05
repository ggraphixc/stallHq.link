import React, { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
} from "react-native";
import { Colors, FontSize, Spacing, BorderRadius } from "../../lib/theme";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "cancel" | "destructive" | "default";
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
}

let globalSetState: ((state: AlertState) => void) | null = null;

/**
 * Show a themed alert dialog. Drop-in replacement for React Native Alert.alert.
 *
 * Usage:
 *   alert("Title", "Message")
 *   alert("Confirm", "Delete this?", [
 *     { text: "Cancel", style: "cancel" },
 *     { text: "Delete", style: "destructive", onPress: () => doDelete() },
 *   ])
 */
export function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (!globalSetState) return;
  globalSetState({
    visible: true,
    title,
    message: message || "",
    buttons: buttons && buttons.length > 0
      ? buttons
      : [{ text: "OK", style: "default" }],
  });
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  globalSetState = setState;

  const dismiss = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const handlePress = useCallback(
    (btn: AlertButton) => {
      dismiss();
      btn.onPress?.();
    },
    [dismiss]
  );

  if (!state.visible) return <>{children}</>;

  return (
    <>
      {children}
      <Modal transparent visible animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.title}>{state.title}</Text>
            {state.message ? (
              <Text style={styles.message}>{state.message}</Text>
            ) : null}
            <View style={styles.buttonRow}>
              {state.buttons.map((btn, i) => {
                const isDestructive = btn.style === "destructive";
                const isCancel = btn.style === "cancel";
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.button,
                      isCancel && styles.buttonCancel,
                      isDestructive && styles.buttonDestructive,
                      state.buttons.length === 1 && styles.buttonFull,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handlePress(btn)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && styles.buttonTextCancel,
                        isDestructive && styles.buttonTextDestructive,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  dialog: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "flex-end",
  },
  button: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.purpleDim,
    borderWidth: 1,
    borderColor: Colors.purple,
    minWidth: 64,
    alignItems: "center",
  },
  buttonFull: {
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.borderSubtle,
  },
  buttonDestructive: {
    backgroundColor: Colors.redDim,
    borderColor: Colors.red,
  },
  buttonText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.purple,
  },
  buttonTextCancel: {
    color: Colors.textSecondary,
  },
  buttonTextDestructive: {
    color: Colors.red,
  },
});
