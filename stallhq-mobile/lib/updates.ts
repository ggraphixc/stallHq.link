export interface OTAUpdateInfo {
  available: boolean;
  isDownloading: boolean;
  isRestartRequired: boolean;
  error: string | null;
}

export async function checkForOTAUpdate(): Promise<OTAUpdateInfo> {
  return {
    available: false,
    isDownloading: false,
    isRestartRequired: false,
    error: null,
  };
}

export async function restartToApplyUpdate(): Promise<void> {}

export function getUpdateChannel(): string {
  return "production";
}

export function getCurrentUpdateId(): string | null {
  return null;
}
