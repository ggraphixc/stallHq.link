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

    if (!selectedFile.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || preview.length === 0) return;

    setLoading(true);
    let success = 0;
    let failed = 0;
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

        if (res.ok) {
          success++;
        } else {
          const data = await res.json();
          failed++;
          errors.push(`${product.name}: ${data.error || "Failed"}`);
        }
      } catch {
        failed++;
        errors.push(`${product.name}: Network error`);
      }
    }

    setResult({ success, failed, errors });
    setLoading(false);

    if (success > 0) {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[var(--glow-purple)]" />
            <h2 className="text-lg font-semibold">Batch Upload Products</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            <h3 className="font-medium mb-2">CSV Format</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Your CSV file should have the following columns:
            </p>
            <code className="block p-2 rounded bg-[var(--bg-primary)] text-sm text-[var(--glow-green)]">
              name, price, category, description, image_url
            </code>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              * name and price are required. Example:
            </p>
            <code className="block p-2 rounded bg-[var(--bg-primary)] text-xs text-[var(--text-muted)] mt-1">
              Premium T-Shirt, 4500, Tops, Soft cotton tee, https://example.com/img.jpg
            </code>
          </div>

          {/* File Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              file
                ? "border-[var(--glow-green)] bg-[var(--glow-green)]/5"
                : "border-[var(--border-subtle)] hover:border-[var(--glow-purple)]"
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-[var(--glow-green)]" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {preview.length} products found
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-[var(--text-muted)]">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">Click to upload CSV</p>
                <p className="text-sm">or drag and drop</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Preview ({preview.length} products)</h3>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border-subtle)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-card)] sticky top-0">
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((product, i) => (
                      <tr key={i} className="border-t border-[var(--border-subtle)]">
                        <td className="p-2">{product.name}</td>
                        <td className="p-2">₦{parseFloat(product.price).toLocaleString()}</td>
                        <td className="p-2 text-[var(--text-muted)]">{product.category || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="text-center p-2 text-sm text-[var(--text-muted)]">
                    ...and {preview.length - 10} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-xl border ${
              result.failed === 0
                ? "bg-[var(--glow-green)]/10 border-[var(--glow-green)]/20"
                : "bg-yellow-500/10 border-yellow-500/20"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.failed === 0 ? (
                  <CheckCircle className="w-5 h-5 text-[var(--glow-green)]" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className="font-medium">
                  {result.success} products uploaded
                  {result.failed > 0 && `, ${result.failed} failed`}
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 text-sm text-[var(--text-secondary)]">
                  {result.errors.slice(0, 5).map((error, i) => (
                    <p key={i}>{error}</p>
                  ))}
                  {result.errors.length > 5 && (
                    <p>...and {result.errors.length - 5} more errors</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
            >
              {result ? "Close" : "Cancel"}
            </button>
            {!result && (
              <button
                onClick={handleUpload}
                disabled={loading || preview.length === 0}
                className="flex-1 glow-button disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  `Upload ${preview.length} Products`
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
