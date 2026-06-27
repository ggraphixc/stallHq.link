"use client";

import { Suspense } from "react";
import SupportDashboard from "./SupportDashboard";

function Particles() {
  return (
    <canvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        background: "var(--bg-primary)",
      }}
    />
  );
}

export default function SupportPage() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Particles />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>}>
          <SupportDashboard />
        </Suspense>
      </div>
    </div>
  );
}
