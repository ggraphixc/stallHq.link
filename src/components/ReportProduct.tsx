"use client";

import { useState } from "react";
import { Flag } from "lucide-react";

interface ReportProductProps {
  productId: string;
  storeId: string;
  productName: string;
}

const REASONS = [
  { value: "fake", label: "Fake or counterfeit" },
  { value: "misleading", label: "Misleading description" },
  { value: "prohibited", label: "Prohibited item" },
  { value: "offensive", label: "Offensive content" },
  { value: "other", label: "Something else" },
];

export function ReportProduct({ productId, storeId, productName }: ReportProductProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!reason) { setError("Please choose a reason"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, store_id: storeId, reason, details: details.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit report");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.625rem 1rem", borderRadius: "0.5rem",
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)", fontSize: "0.8125rem", fontWeight: 500,
          cursor: "pointer", transition: "all 0.15s", width: "fit-content",
        }}
      >
        <Flag size={15} />
        Report product
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }} onClick={() => { if (!submitting) setOpen(false); }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "26rem", borderRadius: "1rem",
              background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
              padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem",
            }}
          >
            {done ? (
              <>
                <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  <Flag size={20} style={{ color: "var(--glow-green)" }} />
                </div>
                <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, textAlign: "center" }}>Report submitted</h4>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center" }}>
                  Thanks — our team and the vendor will review this report.
                </p>
                <button className="glow-button" style={{ padding: "0.75rem", fontSize: "0.8125rem" }} onClick={() => setOpen(false)}>
                  Done
                </button>
              </>
            ) : (
              <>
                <div>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Report “{productName}”</h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Reports are private and reviewed by the vendor & moderation team.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      style={{
                        textAlign: "left", padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
                        fontSize: "0.8125rem", cursor: "pointer", minHeight: "40px",
                        background: reason === r.value ? "rgba(168,133,247,0.12)" : "var(--bg-primary)",
                        border: reason === r.value ? "1px solid var(--glow-purple)" : "1px solid var(--border-subtle)",
                        color: reason === r.value ? "var(--glow-purple)" : "var(--text-secondary)",
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Add details (optional)"
                  maxLength={1000}
                  style={{
                    width: "100%", minHeight: "4rem", padding: "0.625rem 0.75rem", fontSize: "0.8125rem",
                    background: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
                    borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none", resize: "vertical",
                  }}
                />
                {error && <p style={{ fontSize: "0.75rem", color: "var(--glow-red)" }}>{error}</p>}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setOpen(false)}
                    disabled={submitting}
                    style={{ flex: 1, padding: "0.75rem", fontSize: "0.8125rem", background: "none", border: "1px solid var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button onClick={submit} disabled={submitting} className="glow-button" style={{ flex: 1, padding: "0.75rem", fontSize: "0.8125rem" }}>
                    {submitting ? "Submitting…" : "Submit report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
