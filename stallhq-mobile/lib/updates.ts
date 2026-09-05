import * as Updates from "expo-updates";
import { Platform } from "react-native";

export interface OTAUpdateInfo {
  available: boolean;
  isDownloading: boolean;
  isRestartRequired: boolean;
  error: string | null;
}

/**
 * Check for an OTA update and download it if available.
 * Returns the update status — the caller decides when to restart.
 *
 * OTA updates (via expo-updates) deliver JavaScript bundle changes
 * without requiring a new native build. Native code changes still
 * need a full Play Store / App Store release.
 */
export async function checkForOTAUpdate(): Promise<OTAUpdateInfo> {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      return {
        available: true,
        isDownloading: false,
        isRestartRequired: true,
        error: null,
      };
    }
    return {
      available: false,
      isDownloading: false,
      isRestartRequired: false,
      error: null,
    };
  } catch (err: any) {
    return {
      available: false,
      isDownloading: false,
      isRestartRequired: false,
      error: err?.message || "Update check failed",
    };
  }
}

/**
 * Restart the app to apply a downloaded OTA update.
 * Only call this after `checkForOTAUpdate` returned `isRestartRequired: true`.
 */
export async function restartToApplyUpdate(): Promise<void> {
  try {
    await Updates.reloadAsync();
  } catch {}
}

/**
 * Check if the current build is using an OTA update channel.
 * Useful for debugging / displaying update channel info.
 */
export function getUpdateChannel(): string {
  return (Updates as any).updateChannel || "production";
}

/**
 * Get the currently running OTA update ID, if any.
 */
export function getCurrentUpdateId(): string | null {
  try {
    return (Updates as any).updateId || null;
  } catch {
    return null;
  }
}
