"use client";

import { useState, useRef } from "react";
import { Store, Product, ProductVariant } from "@/types";
import { X, Upload, Loader2, Image as ImageIcon, Sparkles, Lock } from "lucide-react";
import { VariantManager } from "./VariantManager";
import { hasAIAccess } from "@/lib/subscription";

interface ProductFormProps {
  store: Store;
  product: Product | null;
  onClose: () => void;
  onSaved?: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.75rem",
  fontSize: "0.8125rem",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "0.375rem",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

export function ProductForm({
  store,
  product,
  onClose,
  onSaved,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [category, setCategory] = useState(product?.category || "");
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [additionalImages, setAdditionalImages] = useState<string[]>(
    product?.images || []
  );
  const [hasVariants, setHasVariants] = useState(product?.has_variants || false);
  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants || []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(
              new File([blob!], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          0.8
        );
      };

      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result as string; };
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("bucket", "products");
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be less than 5MB"); return; }

    const reader = new FileReader();
    reader.onload = () => { setImageUrl(reader.result as string); };
    reader.readAsDataURL(file);

    const url = await uploadImage(file);
    if (url) setImageUrl(url);
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) { alert("Image must be less than 5MB"); continue; }
      const url = await uploadImage(file);
      if (url) setAdditionalImages((prev) => [...prev, url]);
    }
    if (additionalImagesInputRef.current) additionalImagesInputRef.current.value = "";
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateDescription = async () => {
    if (!name.trim()) {
      alert("Please enter a product name first");
      return;
    }
    setGeneratingAI(true);
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim() || undefined,
          price: price || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });
      if (!response.ok) throw new Error("Generation failed");
      const data = await response.json();
      if (data.description) setDescription(data.description);
      if (data.suggestedCategory && !category) setCategory(data.suggestedCategory);
    } catch (error) {
      console.error("AI generation error:", error);
      alert("Failed to generate description. Please try again.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const productData = {
        store_id: store.id,
        name,
        description: description || undefined,
        price: parseFloat(price),
        category: category || undefined,
        image_url: imageUrl || undefined,
        images: additionalImages,
        has_variants: hasVariants,
        variants: hasVariants ? variants : undefined,
      };
      const response = await fetch(
        product ? `/api/products/${product.id}` : "/api/products",
        { method: product ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(productData) }
      );
      if (!response.ok) throw new Error("Failed to save product");
      if (onSaved) onSaved();
      else { onClose(); window.location.reload(); }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div className="slide-up" style={{ position: "relative", width: "100%", maxWidth: "32rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>{product ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose} style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Image Upload */}
          <div>
            <label style={labelStyle}>Product Image</label>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: "0.75rem",
                border: uploading ? "2px dashed var(--glow-purple)" : "2px dashed var(--border-subtle)",
                overflow: "hidden",
                background: "var(--bg-card)",
                cursor: uploading ? "wait" : "pointer",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => { if (!uploading) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--glow-purple)"; }}
              onMouseLeave={(e) => { if (!uploading) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-subtle)"; }}
            >
              {uploading ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                  <Loader2 size={28} style={{ marginBottom: "0.5rem", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "0.75rem" }}>Uploading...</span>
                </div>
              ) : imageUrl ? (
                <>
                  <img src={imageUrl} alt="Product preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0"; }}
                  >
                    <span style={{ fontSize: "0.8125rem", color: "white" }}>Change Image</span>
                  </div>
                </>
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                  <ImageIcon size={28} style={{ marginBottom: "0.5rem" }} />
                  <span style={{ fontSize: "0.8125rem" }}>Click to upload</span>
                  <span style={{ fontSize: "0.6875rem", marginTop: "0.25rem", color: "var(--text-muted)" }}>Max 5MB</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
          </div>

          {/* Additional Images */}
          <div>
            <label style={labelStyle}>Additional Images <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {additionalImages.map((img, index) => (
                <div key={index} className="group" style={{ position: "relative", width: "5rem", height: "5rem", borderRadius: "0.5rem", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                  <img src={img} alt={`Product image ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => removeAdditionalImage(index)}
                    className="sm:!opacity-0 sm:!group-hover:opacity-100"
                    style={{ position: "absolute", top: "0.25rem", right: "0.25rem", width: "1.75rem", height: "1.75rem", borderRadius: "50%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", color: "white", cursor: "pointer", transition: "opacity 0.2s" }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {additionalImages.length < 5 && (
                <button
                  type="button"
                  onClick={() => additionalImagesInputRef.current?.click()}
                  style={{ width: "5rem", height: "5rem", borderRadius: "0.5rem", border: "2px dashed var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", background: "transparent", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--glow-purple)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--glow-purple)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                >
                  <ImageIcon size={18} />
                </button>
              )}
            </div>
            <input ref={additionalImagesInputRef} type="file" accept="image/*" multiple onChange={handleAdditionalImageUpload} style={{ display: "none" }} />
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
              Up to 5 additional images. Max 5MB each.
            </p>
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>Product Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="ambient-input" style={inputStyle} placeholder="Product name" required />
          </div>

          {/* Description */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Description <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
              {hasAIAccess(store) ? (
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={generatingAI || !name.trim()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.25rem 0.625rem",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: generatingAI ? "var(--text-muted)" : "var(--glow-purple)",
                    background: generatingAI ? "rgba(168,85,247,0.05)" : "rgba(168,85,247,0.1)",
                    border: "1px solid rgba(168,85,247,0.2)",
                    borderRadius: "0.375rem",
                    cursor: generatingAI || !name.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: !name.trim() ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => { if (!generatingAI && name.trim()) { e.currentTarget.style.background = "rgba(168,85,247,0.15)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)"; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.background = generatingAI ? "rgba(168,85,247,0.05)" : "rgba(168,85,247,0.1)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.2)"; }}
                >
                  {generatingAI ? (
                    <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  {generatingAI ? "Generating..." : "Generate with AI"}
                </button>
              ) : (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.25rem 0.625rem",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "0.375rem",
                    cursor: "not-allowed",
                    opacity: 0.6,
                  }}
                  title="Upgrade to a paid plan to use AI"
                >
                  <Lock size={10} />
                  <Sparkles size={10} />
                  Pro only
                </span>
              )}
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="ambient-input" style={{ ...inputStyle, resize: "none" }} rows={3} placeholder="Product description" />
          </div>

          {/* Price & Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Price (₦)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="ambient-input" style={inputStyle} placeholder="0" min="0" step="0.01" required />
            </div>
            <div>
              <label style={labelStyle}>Category <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="ambient-input" style={inputStyle} placeholder="e.g. Fashion" />
            </div>
          </div>

          {/* Variants Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.75rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <input
              type="checkbox"
              id="hasVariants"
              checked={hasVariants}
              onChange={(e) => { setHasVariants(e.target.checked); if (!e.target.checked) setVariants([]); }}
              style={{ width: "1rem", height: "1rem", accentColor: "var(--glow-purple)" }}
            />
            <label htmlFor="hasVariants" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", cursor: "pointer" }}>
              This product has variants (size, color, etc.)
            </label>
          </div>

          {/* Variant Manager */}
          {hasVariants && (
            <VariantManager variants={variants} onChange={setVariants} basePrice={parseFloat(price) || 0} />
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || uploading}
            className="glow-button"
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.8125rem", opacity: loading || uploading ? 0.5 : 1, cursor: loading || uploading ? "not-allowed" : "pointer" }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Saving...
              </span>
            ) : product ? "Save Changes" : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
