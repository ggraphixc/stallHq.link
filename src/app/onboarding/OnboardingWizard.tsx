"use client";

import { useState } from "react";
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

const STEPS = ["Store Details", "Add Products", "WhatsApp Connect"];

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
      {/* Animated background orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "25%", left: "33%", width: "24rem", height: "24rem", background: "rgba(168,133,247,0.06)", borderRadius: "50%", filter: "blur(48px)", animation: "float 6s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "25%", right: "33%", width: "20rem", height: "20rem", background: "rgba(6,182,212,0.05)", borderRadius: "50%", filter: "blur(48px)", animation: "float 6s ease-in-out infinite", animationDelay: "-3s" }} />
      </div>

      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(var(--bg-primary),0.8)", backdropFilter: "blur(16px)", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "0 1.5rem", height: "4rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
            <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.75rem", background: "linear-gradient(to bottom right, var(--glow-purple), var(--glow-cyan))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(168,133,247,0.2)" }}>
              <MessageCircle style={{ width: "1.25rem", height: "1.25rem", color: "white" }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: "1.125rem" }} className="text-gradient">StallHq</span>
          </Link>
          {currentStep < STEPS.length - 1 && (
            <button
              onClick={handleSkip}
              style={{ fontSize: "0.875rem", color: "var(--text-muted)", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", background: "transparent", cursor: "pointer" }}
            >
              Skip for now
            </button>
          )}
        </div>
      </header>

      {/* Progress */}
      <div style={{ maxWidth: "42rem", width: "100%", margin: "0 auto", padding: "2.5rem 1.5rem 0", position: "relative", zIndex: 10 }}>
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Content */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem", position: "relative", zIndex: 10 }}>
        <div style={{ width: "100%", maxWidth: "32rem", margin: "0 auto" }}>
          {currentStep === 0 && (
            <StoreDetailsStep
              existingStore={store}
              onStoreCreated={handleStoreCreated}
            />
          )}
          {currentStep === 1 && store && (
            <ProductEntryStep
              store={store}
              onProductsAdded={handleProductsAdded}
              onSkip={handleSkip}
            />
          )}
          {currentStep === 2 && store && (
            <WhatsAppConnectStep
              store={store}
              onConnected={handleWhatsAppConnected}
              onSkip={handleSkip}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", background: "rgba(var(--bg-primary),0.8)", backdropFilter: "blur(16px)", padding: "1.25rem 0", position: "relative", zIndex: 10 }}>
        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </footer>
    </div>
  );
}
