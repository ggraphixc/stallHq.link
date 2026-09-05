import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

interface PlatformInfo {
  version: string;
  minVersion: string;
  downloadUrl: string;
}

/**
 * Public endpoint: latest mobile app versions + download links.
 * Consumed by the web homepage / storefront footers (download badges)
 * and by the mobile app on launch (force-update gate).
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("platform_settings")
      .select("key, value")
      .in("key", [
        "android_version",
        "android_version_code",
        "android_min_version",
        "android_download_url",
        "ios_version",
        "ios_min_version",
        "ios_download_url",
        "app_release_notes",
      ]);

    if (error) throw error;

    const settings: Record<string, unknown> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
    }
    const str = (k: string, fallback = "") =>
      typeof settings[k] === "string" ? (settings[k] as string) : fallback;
    const num = (k: string, fallback = 1) =>
      typeof settings[k] === "number" ? (settings[k] as number) : fallback;

    const android: PlatformInfo = {
      version: str("android_version", "1.0.0"),
      minVersion: str("android_min_version", "1.0.0"),
      downloadUrl: str("android_download_url", ""),
    };
    const ios: PlatformInfo = {
      version: str("ios_version", "1.0.0"),
      minVersion: str("ios_min_version", "1.0.0"),
      downloadUrl: str("ios_download_url", ""),
    };

    return NextResponse.json(
      {
        android: { ...android, versionCode: num("android_version_code", 1) },
        ios,
        releaseNotes: str("app_release_notes", ""),
      },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
    );
  } catch {
    // Never block the app on this endpoint — default to no forced update.
    return NextResponse.json({
      android: { version: "1.0.0", versionCode: 1, minVersion: "1.0.0", downloadUrl: "" },
      ios: { version: "1.0.0", minVersion: "1.0.0", downloadUrl: "" },
      releaseNotes: "",
    });
  }
}
