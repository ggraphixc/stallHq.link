import { useEffect, useRef, useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";
import { BrandLoader } from "../components/BrandLoader";
import { ForceUpdate } from "../components/ForceUpdate";
import { checkAppUpdate, type AppUpdateInfo } from "../lib/appVersion";
import { checkForOTAUpdate } from "../lib/updates";

/** How long the branded loader stays on screen (ms) before routing. */
const MIN_LOADER_MS = 2400;

export default function Index() {
  const { session, loading, store, storeLoaded } = useAuth();
  const [ready, setReady] = useState(false);
  const [update, setUpdate] = useState<AppUpdateInfo | null>(null);
  const [otaReady, setOtaReady] = useState(false);
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (loading || !storeLoaded) return;
    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(0, MIN_LOADER_MS - elapsed);
    const t = setTimeout(() => setReady(true), wait);
    return () => clearTimeout(t);
  }, [loading, storeLoaded]);

  // Version gate + OTA update: both fetched in parallel with auth.
  // Force update blocks routing; OTA updates apply silently.
  useEffect(() => {
    let alive = true;
    checkAppUpdate().then((info) => {
      if (alive) setUpdate(info);
    });
    // Check for OTA update in background — if one is downloaded,
    // we'll offer a restart when the force-update gate is shown.
    checkForOTAUpdate().then((info) => {
      if (alive && info.isRestartRequired) setOtaReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (update?.updateRequired) {
    return <ForceUpdate info={update} otaReady={otaReady} />;
  }

  if (!ready) {
    return (
      <BrandLoader
        label={
          loading || !storeLoaded ? "Opening stallHq" : "Preparing your space"
        }
      />
    );
  }

  // Identity-aware landing: vendors land on their dashboard, signed-in
  // customers land in the customer hub, guests choose a role.
  if (session) {
    if (store) return <Redirect href="/(vendor)/(tabs)" />;
    return <Redirect href="/(customer)/(tabs)" />;
  }

  return <Redirect href="/(auth)/select-role" />;
}
