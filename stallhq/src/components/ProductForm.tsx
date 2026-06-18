"use client";

import { useState, useRef } from "react";
import { Store, Product } from "@/types";
import { X, Upload, Loader2 } from "lucide-react";

interface ProductFormProps {
  store: Store;
  product: Product | null;
  onClose: () => void;
}

export function ProductForm({ store, product, onClose }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [category, setCategory] = useState(product?.category || "");
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
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

        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      img.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("Image must be less than 4MB");
      return;
    }

    const compressed = await compressImage(file);
    setImageUrl(compressed);
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

      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
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
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Product Image
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-square rounded-xl border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--glow-purple)] transition-colors cursor-pointer overflow-hidden bg-[var(--bg-card)]"
            >
              {imageUrl ? (
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
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm">Click to upload</span>
                  <span className="text-xs mt-1">Max 4MB</span>
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

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
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
          <div>
            <label className="block text-sm font-medium mb-2">
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
            <div>
              <label className="block text-sm font-medium mb-2">
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
            <div>
              <label className="block text-sm font-medium mb-2">
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
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
