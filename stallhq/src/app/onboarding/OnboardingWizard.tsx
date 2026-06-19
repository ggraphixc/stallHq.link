"use client";

import { useState } from "react";
import { Store } from "@/types";
import { StepIndicator } from "@/components/StepIndicator";
import { StoreDetailsStep } from "@/components/onboarding/StoreDetailsStep";
import { ProductEntryStep } from "@/components/onboarding/ProductEntryStep";
import { WhatsAppConnectStep } from "@/components/onboarding/WhatsAppConnectStep";
import { OnboardingComplete } from "@/components/onboarding/OnboardingComplete";

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
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-lg">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold">StallHq</span>
          </div>
          {currentStep < STEPS.length - 1 && (
            <button
              onClick={handleSkip}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-8">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
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
    </div>
  );
}
