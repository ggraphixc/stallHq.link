"use client";

import { useState, useRef } from "react";
import { Store } from "@/types";
import {
  Upload,
  FileText,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  Trash2,
  Plus,
  HelpCircle,
} from "lucide-react";

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
  _rowNumber?: number;
  _isValid?: boolean;
  _error?: string;
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

const stepCard: React.CSSProperties = {
  ...glassCard,
  padding: "1rem",
  display: "flex",
  gap: "0.75rem",
  alignItems: "flex-start",
};

const stepNumber: React.CSSProperties = {
  width: "2rem",
  height: "2rem",
  minWidth: "2rem",
  borderRadius: "50%",
  background: "var(--glow-purple)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "0.875rem",
};

const TEMPLATE_CSV = `name,price,category,description,image_url
Ankara Dress,15000,Dresses,Beautiful ankara pattern dress,
Nike Air Max,45000,Shoes,Original Nike air max white,
Samsung Galaxy S21,185000,Phones,Samsung galaxy s21 128gb,
Gold Earring,3500,Jewelry,24k gold plated earring set,
Hair Wig,25000,Beauty,Human hair wig body wave,`;

export function BatchUpload({ store, onClose, onComplete }: BatchUploadProps) {
  const [step, setStep] = useState<"guide" | "upload" | "preview" | "result">("guide");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);
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
    return lines
      .slice(1)
      .map((line, idx) => {
        const values = line.split(",").map((v) => v.trim());
        const product: ParsedProduct = {
          name: values[nameIdx] || "",
          price: values[priceIdx] || "",
          category: categoryIdx !== -1 ? values[categoryIdx] || "" : "",
          description: descIdx !== -1 ? values[descIdx] || "" : "",
          image_url: imageIdx !== -1 ? values[imageIdx] || "" : "",
          _rowNumber: idx + 2,
          _isValid: true,
          _error: "",
        };
        if (!product.name) {
          product._isValid = false;
          product._error = "Product name is empty";
        } else if (!product.price || isNaN(parseFloat(product.price))) {
          product._isValid = false;
          product._error = "Price is missing or not a number";
        } else if (parseFloat(product.price) <= 0) {
          product._isValid = false;
          product._error = "Price must be more than zero";
        }
        return product;
      })
      .filter((p) => p.name || p.price);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith(".csv")) {
      alert("Oops! This file is not a CSV file. Please save your file as CSV first.");
      return;
    }
    setFile(selectedFile);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);
      setStep("preview");
    };
    reader.readAsText(selectedFile);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my_products_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeProduct = (index: number) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const validProducts = preview.filter((p) => p._isValid);
    if (validProducts.length === 0) return;
    setLoading(true);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const product of validProducts) {
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
        if (res.ok) {
          success++;
        } else {
          const data = await res.json();
          failed++;
          errors.push(`${product.name}: ${data.error || "Something went wrong"}`);
        }
      } catch {
        failed++;
        errors.push(`${product.name}: Network problem — check your internet`);
      }
    }
    setResult({ success, failed, errors });
    setStep("result");
    setLoading(false);
    if (success > 0) onComplete();
  };

  const validCount = preview.filter((p) => p._isValid).length;
  const invalidCount = preview.filter((p) => !p._isValid).length;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      <div
        className="slide-up"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "36rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "0.75rem",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Upload size={18} style={{ color: "var(--glow-purple)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>
              {step === "guide"
                ? "Add Many Products At Once"
                : step === "preview"
                  ? "Check Your Products"
                  : step === "result"
                    ? "Done!"
                    : "Upload Your File"}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "2.75rem",
              height: "2.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "0.5rem",
              border: "none",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* ═══ STEP GUIDE ═══ */}
          {step === "guide" && (
            <>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                No worry — e dey simple! Just follow these 3 steps to add many products at once.
              </p>

              {/* Step 1 */}
              <div style={stepCard}>
                <div style={stepNumber}>1</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Download Our Template
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Click the green button below to download a ready-made file. E don already have example products inside — you go just change am to your own products.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    style={{
                      marginTop: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(16,185,129,0.3)",
                      background: "rgba(16,185,129,0.1)",
                      color: "var(--glow-green)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Download size={14} />
                    Download Template File
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div style={stepCard}>
                <div style={stepNumber}>2</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Fill In Your Products
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Open the file with <strong>Excel</strong> or <strong>Google Sheets</strong>. Change the example products to your own. Just enter the <strong>product name</strong> and <strong>price</strong> — the other columns are optional.
                  </p>
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.5rem",
                      borderRadius: "0.375rem",
                      background: "var(--bg-primary)",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      fontFamily: "monospace",
                    }}
                  >
                    <span style={{ color: "var(--glow-green)" }}>name</span>,{" "}
                    <span style={{ color: "var(--glow-green)" }}>price</span>,{" "}
                    <span style={{ color: "var(--text-muted)" }}>category</span>,{" "}
                    <span style={{ color: "var(--text-muted)" }}>description</span>,{" "}
                    <span style={{ color: "var(--text-muted)" }}>image_url</span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
                    ✅ Name and Price = you MUST fill<br />
                    📝 Category, Description, Image URL = optional
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div style={stepCard}>
                <div style={stepNumber}>3</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Save As CSV & Upload
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    When you finish editing, <strong>save the file as CSV</strong> (not Excel file). Then come back here and click the upload button below.
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
                    💡 In Excel: File → Save As → choose "CSV" format
                  </p>
                </div>
              </div>

              {/* Help toggle */}
              <button
                onClick={() => setShowHelp(!showHelp)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.8125rem",
                  color: "var(--glow-purple)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem 0",
                }}
              >
                <HelpCircle size={14} />
                {showHelp ? "Hide tips" : "Need more help?"}
              </button>

              {showHelp && (
                <div style={{ ...glassCard, padding: "0.75rem", fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <p style={{ marginBottom: "0.5rem" }}>
                    <strong>How to save as CSV in Google Sheets:</strong><br />
                    File → Download → Comma Separated Values (.csv)
                  </p>
                  <p style={{ marginBottom: "0.5rem" }}>
                    <strong>How to save as CSV in Excel:</strong><br />
                    File → Save As → Save as type → choose "CSV (Comma delimited)"
                  </p>
                  <p style={{ marginBottom: "0.5rem" }}>
                    <strong>Image URL:</strong> Upload your product picture to anywhere online (like imgbb.com), then paste the link here.
                  </p>
                  <p>
                    <strong>Category examples:</strong> Clothing, Shoes, Electronics, Jewelry, Beauty, Home, Food, etc.
                  </p>
                </div>
              )}

              {/* Upload button */}
              <button
                onClick={() => setStep("upload")}
                className="glow-button"
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                ✅ I Don Send My File — Upload Am Now
              </button>
            </>
          )}

          {/* ═══ FILE UPLOAD ═══ */}
          {step === "upload" && (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed " + (file ? "var(--glow-green)" : "var(--border-subtle)"),
                  borderRadius: "0.75rem",
                  padding: "2.5rem 1rem",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                  background: file ? "rgba(16,185,129,0.04)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!file) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--glow-purple)";
                }}
                onMouseLeave={(e) => {
                  if (!file) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-subtle)";
                }}
              >
                {file ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                    <FileText size={32} style={{ color: "var(--glow-green)" }} />
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{file.name}</p>
                      <p style={{ fontSize: "0.8125rem", color: "var(--glow-green)" }}>
                        ✅ File don ready — {preview.length} products found
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)" }}>
                    <Upload size={36} style={{ margin: "0 auto 0.75rem" }} />
                    <p style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.25rem" }}>
                      Click here to pick your CSV file
                    </p>
                    <p style={{ fontSize: "0.8125rem" }}>Or drag and drop am here</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>

              <button
                onClick={() => setStep("guide")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem 0",
                }}
              >
                ← Go Back to Instructions
              </button>
            </>
          )}

          {/* ═══ PREVIEW ═══ */}
          {step === "preview" && (
            <>
              {invalidCount > 0 && (
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(250,204,21,0.3)",
                    background: "rgba(250,204,21,0.08)",
                    fontSize: "0.8125rem",
                    color: "#facc15",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <AlertCircle size={16} style={{ marginTop: "0.125rem", flexShrink: 0 }} />
                  <div>
                    <strong>{invalidCount} product{invalidCount > 1 ? "s" : ""} get problem</strong>
                    <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      Check the red rows below. You fit remove them or go back fix your file.
                    </p>
                  </div>
                </div>
              )}

              {validCount > 0 && (
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(16,185,129,0.3)",
                    background: "rgba(16,185,129,0.08)",
                    fontSize: "0.8125rem",
                    color: "var(--glow-green)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <CheckCircle size={16} />
                  <span>
                    <strong>{validCount} product{validCount > 1 ? "s" : ""} don ready</strong> for upload
                  </span>
                </div>
              )}

              {/* Product list */}
              <div
                style={{
                  maxHeight: "18rem",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}
              >
                {preview.map((product, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.625rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid " + (product._isValid ? "var(--border-subtle)" : "rgba(250,204,21,0.3)"),
                      background: product._isValid ? "var(--bg-card)" : "rgba(250,204,21,0.05)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {product.name || "Unnamed"}
                        </span>
                        {product.category && (
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              padding: "0.125rem 0.375rem",
                              borderRadius: "0.25rem",
                              background: "rgba(139,92,246,0.15)",
                              color: "var(--glow-purple)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {product.category}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.125rem" }}>
                        <span style={{ color: "var(--glow-green)", fontWeight: 500 }}>
                          ₦{parseFloat(product.price || "0").toLocaleString()}
                        </span>
                        {product._error && (
                          <span style={{ color: "#facc15", fontSize: "0.75rem" }}>⚠ {product._error}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeProduct(i)}
                      style={{
                        width: "1.75rem",
                        height: "1.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "0.375rem",
                        border: "none",
                        background: "transparent",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                      title="Remove this product"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {preview.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.25rem" }}>No products found</p>
                  <p style={{ fontSize: "0.8125rem" }}>Your CSV file no get products. Check the format and try again.</p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                    setStep("guide");
                  }}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    border: "1px solid var(--border-subtle)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                  }}
                >
                  ← Go Back
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading || validCount === 0}
                  className="glow-button"
                  style={{
                    flex: 1.5,
                    padding: "0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    opacity: loading || validCount === 0 ? 0.5 : 1,
                    cursor: loading || validCount === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                      Dey Upload...
                    </span>
                  ) : (
                    "Upload " + validCount + " Product" + (validCount !== 1 ? "s" : "") + " Now"
                  )}
                </button>
              </div>
            </>
          )}

          {/* ═══ RESULT ═══ */}
          {step === "result" && result && (
            <>
              {result.failed === 0 ? (
                <div
                  style={{
                    padding: "1.5rem",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(16,185,129,0.3)",
                    background: "rgba(16,185,129,0.08)",
                    textAlign: "center",
                  }}
                >
                  <CheckCircle size={48} style={{ color: "var(--glow-green)", margin: "0 auto 0.75rem" }} />
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                    🎉 All Done!
                  </h3>
                  <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    <strong>{result.success} product{result.success !== 1 ? "s" : ""}</strong> don enter your store! 🎊
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(250,204,21,0.3)",
                    background: "rgba(250,204,21,0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <AlertCircle size={18} style={{ color: "#facc15" }} />
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                      {result.success} uploaded, {result.failed} no go through
                    </span>
                  </div>
                  {result.errors.length > 0 && (
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                      {result.errors.slice(0, 5).map((error, i) => (
                        <p key={i} style={{ marginBottom: "0.25rem" }}>❌ {error}</p>
                      ))}
                      {result.errors.length > 5 && (
                        <p style={{ color: "var(--text-muted)" }}>...and {result.errors.length - 5} more</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {result.success > 0 && (
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                    setResult(null);
                    setStep("guide");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.375rem",
                    fontSize: "0.8125rem",
                    color: "var(--glow-purple)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem 0",
                    margin: "0 auto",
                  }}
                >
                  <Plus size={14} />
                  Upload More Products
                </button>
              )}

              <button
                onClick={onClose}
                className="glow-button"
                style={{ width: "100%", padding: "0.75rem", fontSize: "0.875rem" }}
              >
                ✅ See My Products
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
