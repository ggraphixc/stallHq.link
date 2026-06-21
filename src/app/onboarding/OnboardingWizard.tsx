"use client";

import { useState, useEffect, useRef } from "react";
import { Store } from "@/types";
import { StepIndicator } from "@/components/StepIndicator";
import { StoreDetailsStep } from "@/components/onboarding/StoreDetailsStep";
import { ProductEntryStep } from "@/components/onboarding/ProductEntryStep";
import { WhatsAppConnectStep } from "@/components/onboarding/WhatsAppConnectStep";
import { OnboardingComplete } from "@/components/onboarding/OnboardingComplete";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

interface OnboardingWizardProps {
  existingStore: { id: string; setup_complete: boolean } | null;
}

const STEPS = ["Store Details", "Add Products", "WhatsApp"];

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.05,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas!.width;
        if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(168, 133, 247, ${p.opacity})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.5 }} />;
}

export function OnboardingWizard({ existingStore }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(existingStore ? 1 : 0);
  const [store, setStore] = useState<Store | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleStoreCreated = (newStore: Store) => {
    setStore(newStore);
    setCurrentStep(1);
  };

  const handleProductsAdded = () => {
    setCurrentStep(2);
  };

  const handleWhatsAppConnected = () => {
    setIsComplete(true);
  };

  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    return <OnboardingComplete store={store} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <Particles />

      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(6,6,11,0.8)", backdropFilter: "blur(16px)", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1.5rem", height: "3.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem", background: "linear-gradient(to bottom right, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle style={{ width: "0.875rem", height: "0.875rem", color: "white" }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: "1rem" }} className="text-gradient">StallHq</span>
          </Link>
          {currentStep < STEPS.length - 1 && (
            <button onClick={handleSkip} style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer" }}>
              Skip
            </button>
          )}
        </div>
      </header>

      {/* Progress */}
      <div style={{ maxWidth: "28rem", width: "100%", margin: "0 auto", padding: "1.5rem 1.5rem 0", position: "relative", zIndex: 10 }}>
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Content */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", position: "relative", zIndex: 10 }}>
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          {currentStep === 0 && (
            <StoreDetailsStep existingStore={store} onStoreCreated={handleStoreCreated} />
          )}
          {currentStep === 1 && store && (
            <ProductEntryStep store={store} onProductsAdded={handleProductsAdded} onSkip={handleSkip} />
          )}
          {currentStep === 2 && store && (
            <WhatsAppConnectStep store={store} onConnected={handleWhatsAppConnected} onSkip={handleSkip} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", background: "rgba(6,6,11,0.8)", backdropFilter: "blur(16px)", padding: "0.75rem 0", position: "relative", zIndex: 10 }}>
        <p style={{ textAlign: "center", fontSize: "0.625rem", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </footer>
    </div>
  );
}
