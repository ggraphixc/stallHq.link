import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
} from "react-native";
import { Colors, FontSize, Spacing, BorderRadius } from "../lib/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOUR_KEY = "stallhq.guided_tour_seen";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TourStep {
  title: string;
  body: string;
  icon: string;
  target?: string; // Optional screen to navigate to
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Your Dashboard!",
    body: "This is your command center. See your stats, recent orders, and quick actions at a glance.",
    icon: "📊",
  },
  {
    title: "Manage Products",
    body: "Add, edit, and organize your product catalog. Toggle availability and set prices.",
    icon: "📦",
  },
  {
    title: "Track Orders",
    body: "View incoming orders, update their status, and keep customers informed.",
    icon: "🛒",
  },
  {
    title: "View Analytics",
    body: "See how your store is performing — visits, clicks, orders, and revenue trends.",
    icon: "📈",
  },
  {
    title: "Customize Your Store",
    body: "Set your theme, store hours, WhatsApp number, and more in Settings.",
    icon: "🎨",
  },
  {
    title: "Share Your Store",
    body: "Share your store link with customers. They can browse and order via WhatsApp!",
    icon: "🔗",
  },
];

interface Props {
  visible: boolean;
  onComplete: () => void;
}

/**
 * Guided tour overlay for new vendors.
 * Shows step-by-step tooltips explaining the dashboard.
 */
export function GuidedTour({ visible, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  async function handleComplete() {
    await AsyncStorage.setItem(TOUR_KEY, "true");
    onComplete();
  }

  function handleNext() {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }

  function handleSkip() {
    handleComplete();
  }

  if (!visible) return null;

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Progress Bar */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          {/* Step Counter */}
          <Text style={styles.stepCounter}>
            {currentStep + 1} of {TOUR_STEPS.length}
          </Text>

          {/* Icon */}
          <Text style={styles.icon}>{step.icon}</Text>

          {/* Content */}
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip Tour</Text>
            </Pressable>

            <Pressable style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextText}>
                {currentStep < TOUR_STEPS.length - 1 ? "Next" : "Get Started"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Check if the guided tour has been seen.
 */
export async function hasSeenTour(): Promise<boolean> {
  try {
    const seen = await AsyncStorage.getItem(TOUR_KEY);
    return seen === "true";
  } catch {
    return false;
  }
}

/**
 * Reset the tour (for testing or re-showing).
 */
export async function resetTour(): Promise<void> {
  await AsyncStorage.removeItem(TOUR_KEY);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  progressBg: {
    height: 4,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 2,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.purple,
    borderRadius: 2,
  },
  stepCounter: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  skipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  nextBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    backgroundColor: Colors.purple,
  },
  nextText: {
    fontSize: FontSize.sm,
    color: "#fff",
    fontWeight: "700",
  },
});
