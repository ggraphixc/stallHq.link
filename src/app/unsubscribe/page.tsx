"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UnsubscribePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to email preferences page
    router.replace("/email-preferences");
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)", padding: "2rem",
    }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Redirecting to email preferences...
        </p>
      </div>
    </div>
  );
}
