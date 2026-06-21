"use client";

import { useState, useRef } from "react";
import { Store } from "@/types";
import { Upload, FileText, Loader2, X, AlertCircle, CheckCircle } from "lucide-react";

interface BatchUploadProps {
  store: Store;
  onClose: () => void;
  onComplete: () => void;
}

interface ParsedProduct {
  name: string;
  price: string;
  category: string;
  description: string;
  image_url: string;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  marginBottom: "0.5rem",
};

export function BatchUpload({ store, onClose, onComplete }: BatchUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): ParsedProduct[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h === "name");
    const priceIdx = headers.findIndex((h) => h === "price");
    const categoryIdx = headers.findIndex((h) => h === "category");
    const descIdx = headers.findIndex((h) => h === "description");
    const imageIdx = headers.findIndex((h) => h === "image_url" || h === "image");
    if (nameIdx === -1 || priceIdx === -1) return [];
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      return {
        name: values[nameIdx] || "",
        price: values[priceIdx] || "",
        category: categoryIdx !== -1 ? values[categoryIdx] || "" : "",
        description: descIdx !== -1 ? values[descIdx] || "" : "",
        image_url: imageIdx !== -1 ? values[imageIdx] || "" : "",
      };
    }).filter((p) => p.name && p.price);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith(".csv")) { alert("Please upload a CSV file"); return; }
    setFile(selectedFile);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setPreview(parseCSV(text));
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || preview.length === 0) return;
    setLoading(true);
    let success = 0, failed = 0;
    const errors: string[] = [];
    for (const product of preview) {
      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_id: store.id,
            name: product.name,
            price: parseFloat(product.price),
            category: product.category || undefined,
            description: product.description || undefined,
            image_url: product.image_url || undefined,
          }),
        });
        if (res.ok) success++;
        else { const data = await res.json(); failed++; errors.push(`${product.name}: ${data.error || "Failed"}`); }
      } catch {
        failed++;
        errors.push(`${product.name}: Network error`);
      }
    }
    setResult({ success, failed, errors });
    setLoading(false);
    if (success > 0) onComplete();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "42rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Upload size={18} style={{ color: "var(--glow-purple)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Batch Upload Products</h2>
          </div>
          <button onClick={onClose} style={{ width: "2rem", height: "2rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Instructions */}
          <div style={{ ...glassCard, padding: "1rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>CSV Format</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              Your CSV file should have the following columns:
            </p>
            <code style={{ display: "block", padding: "0.5rem", borderRadius: "0.375rem", background: "var(--bg-primary)", fontSize: "0.8125rem", color: "var(--glow-green)" }}>
              name, price, category, description, image_url
            </code>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              * name and price are required. Example:
            </p>
            <code style={{ display: "block", padding: "0.5rem", borderRadius: "0.375rem", background: "var(--bg-primary)", fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Premium T-Shirt, 4500, Tops, Soft cotton tee, https://example.com/img.jpg
            </code>
          </div>

          {/* File Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${file ? "var(--glow-green)" : "var(--border-subtle)"}`,
              borderRadius: "0.75rem",
              padding: "2rem",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.2s",
              background: file ? "rgba(16,185,129,0.04)" : "transparent",
            }}
            onMouseEnter={(e) => { if (!file) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--glow-purple)"; }}
            onMouseLeave={(e) => { if (!file) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-subtle)"; }}
          >
            {file ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                <FileText size={28} style={{ color: "var(--glow-green)" }} />
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{file.name}</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{preview.length} products found</p>
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>
                <Upload size={28} style={{ margin: "0 auto 0.5rem" }} />
                <p style={{ fontWeight: 500, fontSize: "0.875rem" }}>Click to upload CSV</p>
                <p style={{ fontSize: "0.8125rem" }}>or drag and drop</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600 }}>Preview ({preview.length} products)</h3>
              <div style={{ maxHeight: "12rem", overflowY: "auto", overflowX: "auto", borderRadius: "0.75rem", border: "1px solid var(--border-subtle)" }}>
                <table style={{ width: "100%", fontSize: "0.8125rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-card)", position: "sticky", top: 0 }}>
                      {["Name", "Price", "Category"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "0.5rem", fontWeight: 500, color: "var(--text-muted)", fontSize: "0.75rem" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((product, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "0.5rem" }}>{product.name}</td>
                        <td style={{ padding: "0.5rem" }}>₦{parseFloat(product.price).toLocaleString()}</td>
                        <td style={{ padding: "0.5rem", color: "var(--text-muted)" }}>{product.category || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p style={{ textAlign: "center", padding: "0.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    ...and {preview.length - 10} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{
              padding: "1rem",
              borderRadius: "0.75rem",
              border: `1px solid ${result.failed === 0 ? "rgba(16,185,129,0.2)" : "rgba(250,204,21,0.2)"}`,
              background: result.failed === 0 ? "rgba(16,185,129,0.08)" : "rgba(250,204,21,0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                {result.failed === 0 ? <CheckCircle size={18} style={{ color: "var(--glow-green)" }} /> : <AlertCircle size={18} style={{ color: "#facc15" }} />}
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                  {result.success} products uploaded{result.failed > 0 && `, ${result.failed} failed`}
                </span>
              </div>
              {result.errors.length > 0 && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  {result.errors.slice(0, 5).map((error, i) => <p key={i}>{error}</p>)}
                  {result.errors.length > 5 && <p>...and {result.errors.length - 5} more errors</p>}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.8125rem", transition: "all 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--text-muted)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"; }}
            >
              {result ? "Close" : "Cancel"}
            </button>
            {!result && (
              <button
                onClick={handleUpload}
                disabled={loading || preview.length === 0}
                className="glow-button"
                style={{ flex: 1, padding: "0.75rem", fontSize: "0.8125rem", opacity: loading || preview.length === 0 ? 0.5 : 1, cursor: loading || preview.length === 0 ? "not-allowed" : "pointer" }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Uploading...
                  </span>
                ) : `Upload ${preview.length} Products`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
