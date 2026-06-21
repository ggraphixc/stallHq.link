"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Store, Product, ProductVariant } from "@/types";
import {
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Save,
  Plus,
  GripVertical,
} from "lucide-react";

interface EditProductClientProps {
  store: Store;
  product: Product;
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

const hintStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  color: "var(--text-muted)",
  marginTop: "0.25rem",
};

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(12px)",
};

/* ── Particle canvas ────────────────────────────── */

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const colors = [
      "rgba(168,133,247,0.12)",
      "rgba(6,182,212,0.1)",
      "rgba(16,185,129,0.08)",
      "rgba(236,72,153,0.06)",
    ];

    const dots = Array.from({ length: 30 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.5,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      dots.forEach((d) => {
        d.x += d.dx;
        d.y += d.dy;
        if (d.x < 0 || d.x > w) d.dx *= -1;
        if (d.y < 0 || d.y > h) d.dy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
    />
  );
}

const COMMON_OPTIONS = [
  { name: "Size", values: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
  { name: "Color", values: ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Orange", "Grey", "Brown", "Navy"] },
  { name: "Material", values: ["Cotton", "Polyester", "Silk", "Leather", "Denim", "Wool"] },
];

/* ── Main Component ─────────────────────────────── */

export function EditProductClient({
  store,
  product,
}: EditProductClientProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(product.price.toString());
  const [category, setCategory] = useState(product.category || "");
  const [imageUrl, setImageUrl] = useState(product.image_url || "");
  const [additionalImages, setAdditionalImages] = useState<string[]>(product.images || []);
  const [inStock, setInStock] = useState(product.in_stock);
  const [hasVariants, setHasVariants] = useState(product.has_variants);
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);

  const [drafts, setDrafts] = useState<Array<{ optionName: string; optionValue: string; price: string; stock: string; sku: string }>>([
    { optionName: "Size", optionValue: "", price: "", stock: "0", sku: "" },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);

  /* ── Image Upload ─────────────────────────────── */

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > 800) { h = (h * 800) / w; w = 800; }
        if (h > 800) { w = (w * 800) / h; h = 800; }
        canvas.width = w;
        canvas.height = h;
        ctx?.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => resolve(new File([blob!], file.name, { type: "image/jpeg", lastModified: Date.now() })),
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
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data.url;
    } catch {
      alert("Failed to upload image.");
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
      if (files[i].size > 5 * 1024 * 1024) { alert("Image must be less than 5MB"); continue; }
      const url = await uploadImage(files[i]);
      if (url) setAdditionalImages((prev) => [...prev, url]);
    }
    if (additionalImagesInputRef.current) additionalImagesInputRef.current.value = "";
  };

  /* ── Variants ─────────────────────────────────── */

  const addDraft = () => setDrafts([...drafts, { optionName: "Size", optionValue: "", price: "", stock: "0", sku: "" }]);
  const removeDraft = (i: number) => setDrafts(drafts.filter((_, idx) => idx !== i));
  const updateDraft = (i: number, field: string, value: string) => {
    const updated = [...drafts];
    (updated[i] as any)[field] = value;
    setDrafts(updated);
  };

  const addVariants = () => {
    const newVariants: ProductVariant[] = drafts
      .filter((d) => d.optionValue)
      .map((d, i) => ({
        id: `temp-${Date.now()}-${i}`,
        product_id: product.id,
        name: `${d.optionName}: ${d.optionValue}`,
        option_name: d.optionName,
        option_value: d.optionValue,
        price: d.price ? parseFloat(d.price) : null,
        stock: parseInt(d.stock) || 0,
        sku: d.sku || null,
      }));
    setVariants([...variants, ...newVariants]);
    setDrafts([{ optionName: "Size", optionValue: "", price: "", stock: "0", sku: "" }]);
  };

  const removeVariant = (id: string) => setVariants(variants.filter((v) => v.id !== id));

  const groupedVariants = variants.reduce(
    (acc, v) => { if (!acc[v.option_name]) acc[v.option_name] = []; acc[v.option_name].push(v); return acc; },
    {} as Record<string, ProductVariant[]>
  );

  /* ── Save ─────────────────────────────────────── */

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          price: parseFloat(price),
          category: category || undefined,
          image_url: imageUrl || undefined,
          images: additionalImages,
          in_stock: inStock,
          has_variants: hasVariants,
          variants: hasVariants ? variants : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Delete ───────────────────────────────────── */

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard/products");
    } catch {
      alert("Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Toggle Stock ─────────────────────────────── */

  const handleToggleStock = async () => {
    setToggling(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ in_stock: !inStock }),
      });
      if (res.ok) setInStock(!inStock);
    } catch {
      alert("Failed to update.");
    } finally {
      setToggling(false);
    }
  };

  /* ── Render ───────────────────────────────────── */

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative" }}>
      <Particles />

      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(6,6,11,0.85)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "0 1rem",
            height: "3.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => router.push("/dashboard/products")}
              style={{
                width: "2rem",
                height: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0.5rem",
                border: "1px solid var(--border-subtle)",
                background: "rgba(255,255,255,0.03)",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 style={{ fontWeight: 700, fontSize: "0.875rem" }}>Edit Product</h1>
              <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "12rem" }}>
                {product.name}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            {/* Toggle Stock */}
            <button
              onClick={handleToggleStock}
              disabled={toggling}
              title={inStock ? "Deactivate" : "Activate"}
              style={{
                height: "2.25rem",
                padding: "0 0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                borderRadius: "0.5rem",
                border: `1px solid ${inStock ? "rgba(16,185,129,0.3)" : "var(--border-subtle)"}`,
                background: inStock ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
                color: inStock ? "var(--glow-green)" : "var(--text-muted)",
                cursor: toggling ? "wait" : "pointer",
                fontSize: "0.75rem",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              {toggling ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : inStock ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              <span className="hidden sm:inline">{inStock ? "Active" : "Inactive"}</span>
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete product"
              style={{
                width: "2.25rem",
                height: "2.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0.5rem",
                border: "1px solid var(--border-subtle)",
                background: "rgba(255,255,255,0.03)",
                color: "var(--text-muted)",
                cursor: deleting ? "wait" : "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--glow-red)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
            >
              {deleting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "1.5rem 1rem", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Image Upload */}
          <div style={{ ...glassCard, padding: "1.25rem" }}>
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
                  <span style={{ fontSize: "0.6875rem", marginTop: "0.25rem" }}>Max 5MB</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
          </div>

          {/* Additional Images */}
          <div style={{ ...glassCard, padding: "1.25rem" }}>
            <label style={labelStyle}>Additional Images <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {additionalImages.map((img, index) => (
                <div key={index} className="group" style={{ position: "relative", width: "5rem", height: "5rem", borderRadius: "0.5rem", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                  <img src={img} alt={`Image ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => setAdditionalImages(additionalImages.filter((_, i) => i !== index))}
                    className="sm:!opacity-0 sm:!group-hover:opacity-100"
                    style={{ position: "absolute", top: "0.25rem", right: "0.25rem", width: "1.75rem", height: "1.75rem", borderRadius: "50%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", color: "white", cursor: "pointer" }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {additionalImages.length < 5 && (
                <button
                  type="button"
                  onClick={() => additionalImagesInputRef.current?.click()}
                  style={{ width: "5rem", height: "5rem", borderRadius: "0.5rem", border: "2px dashed var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", background: "transparent", cursor: "pointer" }}
                >
                  <ImageIcon size={18} />
                </button>
              )}
            </div>
            <input ref={additionalImagesInputRef} type="file" accept="image/*" multiple onChange={handleAdditionalImageUpload} style={{ display: "none" }} />
            <p style={hintStyle}>Up to 5 additional images. Max 5MB each.</p>
          </div>

          {/* Details */}
          <div style={{ ...glassCard, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Product Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="ambient-input" style={inputStyle} required />
            </div>

            <div>
              <label style={labelStyle}>Description <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="ambient-input" style={{ ...inputStyle, resize: "none" }} rows={3} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
              <div>
                <label style={labelStyle}>Price (₦)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="ambient-input" style={inputStyle} min="0" step="0.01" required />
              </div>
              <div>
                <label style={labelStyle}>Category <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(optional)</span></label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="ambient-input" style={inputStyle} placeholder="e.g. Fashion" />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div style={{ ...glassCard, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Variants</label>
              <div
                onClick={() => { setHasVariants(!hasVariants); if (hasVariants) setVariants([]); }}
                style={{
                  width: "2.5rem",
                  height: "1.375rem",
                  borderRadius: "0.6875rem",
                  background: hasVariants ? "var(--glow-purple)" : "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <div style={{
                  width: "1.125rem",
                  height: "1.125rem",
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  top: "1px",
                  left: hasVariants ? "1.25rem" : "1px",
                  transition: "left 0.2s",
                }} />
              </div>
            </div>

            {hasVariants && (
              <>
                {/* Existing variants */}
                {Object.entries(groupedVariants).map(([optionName, optionVariants]) => (
                  <div key={optionName} style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                    <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.5rem" }}>{optionName}</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {optionVariants.map((v) => (
                        <div key={v.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <GripVertical size={12} style={{ color: "var(--text-muted)" }} />
                          <span style={{ flex: 1, fontSize: "0.8125rem" }}>{v.option_value}</span>
                          {v.price !== null && <span style={{ fontSize: "0.6875rem", color: "var(--glow-green)" }}>₦{v.price.toLocaleString()}</span>}
                          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Stock: {v.stock}</span>
                          <button type="button" onClick={() => removeVariant(v.id)} style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", flexShrink: 0 }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add variants */}
                <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <h4 style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Add Variants</h4>
                  {drafts.map((draft, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                      <select value={draft.optionName} onChange={(e) => updateDraft(i, "optionName", e.target.value)} className="ambient-input" style={{ ...inputStyle, fontSize: "0.75rem", padding: "0.5rem" }}>
                        {COMMON_OPTIONS.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
                        <option value="custom">Custom</option>
                      </select>
                      <select value={draft.optionValue} onChange={(e) => updateDraft(i, "optionValue", e.target.value)} className="ambient-input" style={{ ...inputStyle, fontSize: "0.75rem", padding: "0.5rem" }}>
                        <option value="">Select</option>
                        {COMMON_OPTIONS.find((o) => o.name === draft.optionName)?.values.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <input type="number" value={draft.price} onChange={(e) => updateDraft(i, "price", e.target.value)} placeholder="Price" className="ambient-input" style={{ ...inputStyle, fontSize: "0.75rem", padding: "0.5rem" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <input type="number" value={draft.stock} onChange={(e) => updateDraft(i, "stock", e.target.value)} placeholder="Stock" className="ambient-input" style={{ ...inputStyle, fontSize: "0.75rem", padding: "0.5rem", flex: 1 }} />
                        {drafts.length > 1 && (
                          <button type="button" onClick={() => removeDraft(i)} style={{ width: "2.75rem", height: "2.75rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.375rem", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", flexShrink: 0 }}>
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button type="button" onClick={addDraft} style={{ fontSize: "0.75rem", color: "var(--glow-purple)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", padding: 0 }}>
                      <Plus size={12} /> Add another
                    </button>
                    <button
                      type="button"
                      onClick={addVariants}
                      disabled={drafts.every((d) => !d.optionValue)}
                      style={{ flex: 1, padding: "0.5rem", borderRadius: "0.5rem", background: "rgba(168,133,247,0.1)", color: "var(--glow-purple)", fontSize: "0.75rem", fontWeight: 600, border: "none", cursor: drafts.every((d) => !d.optionValue) ? "not-allowed" : "pointer", opacity: drafts.every((d) => !d.optionValue) ? 0.5 : 1 }}
                    >
                      Add Variants
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={loading || uploading}
            className="glow-button"
            style={{
              width: "100%",
              padding: "0.875rem",
              fontSize: "0.875rem",
              opacity: loading || uploading ? 0.5 : 1,
              cursor: loading || uploading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Saving...
              </span>
            ) : saved ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <Save size={16} />
                Saved!
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <Save size={16} />
                Save Changes
              </span>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
