import Constants from "expo-constants";
import { Platform } from "react-native";
import { WEB_API_URL } from "./config";

export interface AppUpdateInfo {
  /** True when the installed version is below the admin-configured minimum. */
  updateRequired: boolean;
  /** True when a newer version exists but is not mandatory. */
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
}

interface PlatformInfo {
  version: string;
  minVersion: string;
  downloadUrl: string;
}

interface AppVersionResponse {
  android: PlatformInfo & { versionCode: number };
  ios: PlatformInfo;
  releaseNotes: string;
}

/** Compare dotted versions numerically: 1.10.2 > 1.9.9. Returns -1/0/1. */
export function compareVersions(a: string, b: string): number {
  const pa = String(a || "0").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b || "0").split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

/** The version of the installed native binary (falls back to the JS config). */
export function getInstalledVersion(): string {
  return (
    (Constants as any).nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    "1.0.0"
  );
}

/**
 * Ask the web API for the latest app versions and decide whether this
 * install is below the admin-configured minimum (force update) or just
 * outdated (optional update). Never throws — network failures are treated
 * as "no update" so users are never locked out by a connectivity blip.
 */
export async function checkAppUpdate(): Promise<AppUpdateInfo> {
  const currentVersion = getInstalledVersion();
  const empty: AppUpdateInfo = {
    updateRequired: false,
    updateAvailable: false,
    currentVersion,
    latestVersion: currentVersion,
    downloadUrl: "",
    releaseNotes: "",
  };

  try {
    const res = await fetch(`${WEB_API_URL}/api/app-version`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return empty;
    const data: AppVersionResponse = await res.json();

    const platform = Platform.OS === "ios" ? data.ios : data.android;
    const latest = platform?.version || currentVersion;
    const minVersion = platform?.minVersion || currentVersion;

    return {
      updateRequired: compareVersions(currentVersion, minVersion) < 0,
      updateAvailable: compareVersions(currentVersion, latest) < 0,
      currentVersion,
      latestVersion: latest,
      downloadUrl: platform?.downloadUrl || "",
      releaseNotes: data.releaseNotes || "",
    };
  } catch {
    return empty;
  }
}
