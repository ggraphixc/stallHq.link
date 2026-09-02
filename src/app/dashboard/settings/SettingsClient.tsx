"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Store } from "@/types";
import { StoreSettings } from "@/components/StoreSettings";

interface SettingsClientProps {
  store: Store;
}

export function SettingsClient({ store: initialStore }: SettingsClientProps) {
  const router = useRouter();
  const [store] = useState<Store>(initialStore);
  const [showSettings, setShowSettings] = useState(true);

  const handleStoreUpdated = (updatedStore: Store) => {
    // Navigate back to dashboard after save
    router.push("/dashboard");
  };

  const handleClose = () => {
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Loading state while modal opens */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", color: "var(--text-muted)", fontSize: "0.875rem",
      }}>
        Loading settings...
      </div>

      {/* Store Settings Modal */}
      {showSettings && (
        <StoreSettings
          store={store}
          onClose={handleClose}
          onSaved={handleStoreUpdated}
        />
      )}
    </div>
  );
}
