"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "@/types";
import { ProductForm } from "@/components/ProductForm";
import { ArrowLeft, Package } from "lucide-react";

interface NewProductClientProps {
  store: Store;
}

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

/* ── Particle canvas ────────────────────────────── */

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const colors = [
      "rgba(168,133,247,0.12)",
      "rgba(6,182,212,0.1)",
      "rgba(16,185,129,0.08)",
      "rgba(236,72,153,0.06)",
    ];

    const dots = Array.from({ length: 30 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.5,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      dots.forEach((d) => {
        d.x += d.dx;
        d.y += d.dy;
        if (d.x < 0 || d.x > w) d.dx *= -1;
        if (d.y < 0 || d.y > h) d.dy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
    />
  );
}

/* ── Main Component ─────────────────────────────── */

export function NewProductClient({ store }: NewProductClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(true);

  const handleSaved = () => {
    router.push("/dashboard/products");
  };

  const handleClose = () => {
    router.push("/dashboard/products");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative" }}>
      <Particles />

      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(6,6,11,0.85)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "0 1rem",
            height: "3.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => router.push("/dashboard/products")}
              style={{
                width: "2rem",
                height: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0.5rem",
                border: "1px solid var(--border-subtle)",
                background: "rgba(255,255,255,0.03)",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 style={{ fontWeight: 700, fontSize: "0.875rem" }}>Add Product</h1>
              <p style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                Create a new product listing
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "1.5rem 1rem", position: "relative", zIndex: 1 }}>
        {showForm && (
          <ProductForm
            store={store}
            product={null}
            onClose={handleClose}
            onSaved={handleSaved}
          />
        )}
      </main>
    </div>
  );
}
