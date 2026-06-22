"use client";

import { Suspense } from "react";
import SupportDashboard from "./SupportDashboard";

export default function SupportPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>}>
      <SupportDashboard />
    </Suspense>
  );
}
