"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type AlertType = "info" | "success" | "error" | "warning";

interface AlertItem {
  id: string;
  type: AlertType;
  message: string;
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

interface AlertContextValue {
  alert: (message: string, options?: { type?: AlertType; duration?: number }) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AlertItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: AlertType, duration = 4000) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const alertFn = useCallback(
    (message: string, options?: { type?: AlertType; duration?: number }) => {
      addToast(message, options?.type || "info", options?.duration ?? 4000);
    },
    [addToast]
  );

  const successFn = useCallback(
    (message: string, duration?: number) => {
      addToast(message, "success", duration ?? 3000);
    },
    [addToast]
  );

  const errorFn = useCallback(
    (message: string, duration?: number) => {
      addToast(message, "error", duration ?? 5000);
    },
    [addToast]
  );

  const infoFn = useCallback(
    (message: string, duration?: number) => {
      addToast(message, "info", duration ?? 4000);
    },
    [addToast]
  );

  const warningFn = useCallback(
    (message: string, duration?: number) => {
      addToast(message, "warning", duration ?? 4000);
    },
    [addToast]
  );

  const confirmFn = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ open: true, options, resolve });
    });
  }, []);

  const handleConfirm = useCallback((value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  }, [confirmState]);

  return (
    <AlertContext.Provider
      value={{ alert: alertFn, success: successFn, error: errorFn, info: infoFn, warning: warningFn, confirm: confirmFn }}
    >
      {children}

      {/* Toast Container */}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxWidth: "24rem",
          width: "100%",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmState?.open && (
        <ConfirmDialog
          options={confirmState.options}
          onConfirm={() => handleConfirm(true)}
          onCancel={() => handleConfirm(false)}
        />
      )}
    </AlertContext.Provider>
  );
}

/* ── Toast Component ────────────────────────────── */

const TOAST_CONFIG: Record<AlertType, { bg: string; border: string; icon: string; progressColor: string }> = {
  info: {
    bg: "rgba(6, 182, 212, 0.08)",
    border: "rgba(6, 182, 212, 0.2)",
    icon: "i",
    progressColor: "var(--glow-cyan)",
  },
  success: {
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.2)",
    icon: "✓",
    progressColor: "var(--glow-green)",
  },
  error: {
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.2)",
    icon: "✕",
    progressColor: "var(--glow-red)",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.2)",
    icon: "!",
    progressColor: "var(--glow-amber)",
  },
};

const ICON_COLORS: Record<AlertType, string> = {
  info: "var(--glow-cyan)",
  success: "var(--glow-green)",
  error: "var(--glow-red)",
  warning: "var(--glow-amber)",
};

function Toast({ toast, onDismiss }: { toast: AlertItem; onDismiss: () => void }) {
  const cfg = TOAST_CONFIG[toast.type];

  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.875rem 1rem",
        background: "var(--bg-card)",
        border: `1px solid ${cfg.border}`,
        borderRadius: "0.75rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "2px",
            background: cfg.progressColor,
            width: "100%",
            animation: `shrink ${toast.duration}ms linear forwards`,
          }}
        />
      )}

      {/* Icon */}
      <div
        style={{
          width: "1.5rem",
          height: "1.5rem",
          borderRadius: "50%",
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "0.75rem",
          fontWeight: 700,
          color: ICON_COLORS[toast.type],
        }}
      >
        {cfg.icon}
      </div>

      {/* Message */}
      <p style={{ fontSize: "0.8125rem", color: "var(--text-primary)", lineHeight: 1.5, flex: 1, margin: 0 }}>
        {toast.message}
      </p>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          padding: "0.25rem",
          fontSize: "0.875rem",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/* ── Confirm Dialog ────────────────────────────── */

function ConfirmDialog({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isDanger = options.variant === "danger";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "24rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "1rem",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Icon */}
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "50%",
              background: isDanger ? "rgba(239,68,68,0.1)" : "rgba(168,133,247,0.1)",
              border: `1px solid ${isDanger ? "rgba(239,68,68,0.2)" : "rgba(168,133,247,0.2)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.125rem",
            }}
          >
            {isDanger ? "⚠" : "?"}
          </div>

          {/* Title */}
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {options.title}
          </h3>

          {/* Message */}
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
            {options.message}
          </p>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button
              onClick={onCancel}
              style={{
                padding: "0.625rem 1.25rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                borderRadius: "0.5rem",
                border: "1px solid var(--border-subtle)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s",
                minHeight: "44px",
              }}
            >
              {options.cancelLabel || "Cancel"}
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: "0.625rem 1.25rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                borderRadius: "0.5rem",
                border: "none",
                background: isDanger
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : "linear-gradient(135deg, var(--glow-purple), #7c3aed)",
                color: "white",
                cursor: "pointer",
                transition: "all 0.2s",
                minHeight: "44px",
              }}
            >
              {options.confirmLabel || "Confirm"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
