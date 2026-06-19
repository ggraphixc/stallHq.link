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
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[var(--glow-purple)]/6 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[var(--glow-cyan)]/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
      </div>

      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-lg relative z-10">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--glow-purple)] to-[var(--glow-cyan)] flex items-center justify-center shadow-lg shadow-[var(--glow-purple)]/20 group-hover:shadow-[var(--glow-purple)]/40 transition-shadow">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gradient">StallHq</span>
          </Link>
          {currentStep < STEPS.length - 1 && (
            <button
              onClick={handleSkip}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-4 py-2 rounded-lg hover:bg-[var(--bg-card)]"
            >
              Skip for now
            </button>
          )}
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full px-6 pt-8 relative z-10">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-lg">
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
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-lg py-5 relative z-10">
        <p className="text-center text-xs text-[var(--text-muted)]">
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </footer>
    </div>
  );
}
