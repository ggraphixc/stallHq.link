import { useEffect, useRef, useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";
import { BrandLoader } from "../components/BrandLoader";
import { ForceUpdate } from "../components/ForceUpdate";
import { checkAppUpdate, type AppUpdateInfo } from "../lib/appVersion";

/** How long the branded loader stays on screen (ms) before routing. */
const MIN_LOADER_MS = 2400;

export default function Index() {
  const { session, loading, store, storeLoaded } = useAuth();
  const [ready, setReady] = useState(false);
  const [update, setUpdate] = useState<AppUpdateInfo | null>(null);
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (loading || !storeLoaded) return;
    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(0, MIN_LOADER_MS - elapsed);
    const t = setTimeout(() => setReady(true), wait);
    return () => clearTimeout(t);
  }, [loading, storeLoaded]);

  // Version gate: fetched in parallel with auth so it never slows the
  // loader down. A forced update blocks routing until the app is updated.
  useEffect(() => {
    let alive = true;
    checkAppUpdate().then((info) => {
      if (alive) setUpdate(info);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (update?.updateRequired) {
    return <ForceUpdate info={update} />;
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
