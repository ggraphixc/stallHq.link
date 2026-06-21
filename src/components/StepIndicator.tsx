"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: index < steps.length - 1 ? 1 : "none" }}>
            {/* Step circle + label */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
              <div
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  transition: "all 0.3s",
                  background: isCompleted
                    ? "var(--glow-green)"
                    : isCurrent
                    ? "var(--glow-purple)"
                    : "var(--bg-card)",
                  color: isCompleted || isCurrent ? "white" : "var(--text-muted)",
                  border: isCompleted || isCurrent ? "none" : "1px solid var(--border-subtle)",
                  boxShadow: isCurrent
                    ? "0 0 20px rgba(168,133,247,0.3)"
                    : isCompleted
                    ? "0 0 16px rgba(16,185,129,0.2)"
                    : "none",
                }}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : index + 1}
              </div>
              <span
                style={{
                  fontSize: "0.625rem",
                  fontWeight: isCurrent ? 600 : 500,
                  color: isCurrent
                    ? "var(--text-primary)"
                    : isCompleted
                    ? "var(--glow-green)"
                    : "var(--text-muted)",
                  textAlign: "center",
                  maxWidth: "72px",
                  letterSpacing: "0.02em",
                }}
              >
                {step}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div style={{ flex: 1, height: "2px", margin: "0 0.375rem", marginTop: "-1.25rem", borderRadius: "1px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: "1px",
                    transition: "background 0.5s",
                    background: isCompleted
                      ? "var(--glow-green)"
                      : isCurrent
                      ? "linear-gradient(to right, var(--glow-purple), var(--border-subtle))"
                      : "var(--border-subtle)",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
