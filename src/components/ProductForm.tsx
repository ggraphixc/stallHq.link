"use client";

import { useState, useRef } from "react";
import { Store, Product, ProductVariant } from "@/types";
import { X, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { VariantManager } from "./VariantManager";

interface ProductFormProps {
  store: Store;
  product: Product | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function ProductForm({
  store,
  product,
  onClose,
  onSaved,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);

    try {
      // Compress image first
      const compressed = await compressImage(file);

      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("bucket", "products");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

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

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to storage
    const url = await uploadImage(file);
    if (url) {
      setImageUrl(url);
    }
  };

  const handleAdditionalImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        continue;
      }

      const url = await uploadImage(file);
      if (url) {
        setAdditionalImages((prev) => [...prev, url]);
      }
    }

    // Reset input
    if (additionalImagesInputRef.current) {
      additionalImagesInputRef.current.value = "";
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const additionalImagesInputRef = useRef<HTMLInputElement>(null);

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
        {
          method: product ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        }
      );

      if (!response.ok) throw new Error("Failed to save product");

      if (onSaved) {
        onSaved();
      } else {
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Product Image
            </label>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`relative aspect-square rounded-xl border-2 border-dashed transition-colors overflow-hidden bg-[var(--bg-card)] ${
                uploading
                  ? "border-[var(--glow-purple)] cursor-wait"
                  : "border-[var(--border-subtle)] hover:border-[var(--glow-purple)] cursor-pointer"
              }`}
            >
              {uploading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)]">
                  <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              ) : imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-sm">Change Image</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)]">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-sm">Click to upload</span>
                  <span className="text-xs mt-1">Max 5MB</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Additional Images */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Additional Images (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {additionalImages.map((img, index) => (
                <div
                  key={index}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--border-subtle)] group"
                >
                  <img
                    src={img}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeAdditionalImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {additionalImages.length < 5 && (
                <button
                  type="button"
                  onClick={() => additionalImagesInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--glow-purple)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--glow-purple)] transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              )}
            </div>
            <input
              ref={additionalImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAdditionalImageUpload}
              className="hidden"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Up to 5 additional images. Max 5MB each.
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="ambient-input"
              placeholder="Product name"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="ambient-input resize-none"
              rows={3}
              placeholder="Product description"
            />
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                Price (₦) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="ambient-input"
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="ambient-input"
                placeholder="e.g. Fashion"
              />
            </div>
          </div>

          {/* Variants Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            <input
              type="checkbox"
              id="hasVariants"
              checked={hasVariants}
              onChange={(e) => {
                setHasVariants(e.target.checked);
                if (!e.target.checked) setVariants([]);
              }}
              className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--glow-purple)] focus:ring-[var(--glow-purple)]"
            />
            <label htmlFor="hasVariants" className="text-sm">
              This product has variants (size, color, etc.)
            </label>
          </div>

          {/* Variant Manager */}
          {hasVariants && (
            <VariantManager
              variants={variants}
              onChange={setVariants}
              basePrice={parseFloat(price) || 0}
            />
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || uploading}
            className="glow-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : product ? (
              "Save Changes"
            ) : (
              "Add Product"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
