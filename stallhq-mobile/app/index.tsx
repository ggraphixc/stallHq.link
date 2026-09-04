import { useEffect, useRef, useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";
import { BrandLoader } from "../components/BrandLoader";

/** How long the branded loader stays on screen (ms) before routing. */
const MIN_LOADER_MS = 2400;

export default function Index() {
  const { session, loading, store, storeLoaded } = useAuth();
  const [ready, setReady] = useState(false);
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (loading || !storeLoaded) return;
    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(0, MIN_LOADER_MS - elapsed);
    const t = setTimeout(() => setReady(true), wait);
    return () => clearTimeout(t);
  }, [loading, storeLoaded]);

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
