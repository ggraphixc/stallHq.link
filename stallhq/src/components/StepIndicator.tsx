"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? "bg-[var(--glow-green)] text-white shadow-lg shadow-[var(--glow-green)]/20"
                    : isCurrent
                    ? "bg-[var(--glow-purple)] text-white shadow-lg shadow-[var(--glow-purple)]/30 ring-4 ring-[var(--glow-purple)]/20"
                    : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs mt-2.5 font-medium transition-colors text-center max-w-[80px] ${
                  isCurrent
                    ? "text-[var(--text-primary)]"
                    : isCompleted
                    ? "text-[var(--glow-green)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {step}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 mt-[-20px]">
                <div
                  className={`h-full rounded-full transition-colors duration-500 ${
                    isCompleted
                      ? "bg-[var(--glow-green)]"
                      : isCurrent
                      ? "bg-gradient-to-r from-[var(--glow-purple)] to-[var(--border-subtle)]"
                      : "bg-[var(--border-subtle)]"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
