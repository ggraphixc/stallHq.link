"use client";

import { useState, useEffect, useCallback } from "react";
import { CartItem, Product, ProductVariant } from "@/types";

const CART_KEY = "stallhq_cart";

function getStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStoredCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

// Generate a unique key for cart item (product + variant combo)
function getItemKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}-${variantId}` : productId;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setItems(getStoredCart());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveStoredCart(items);
    }
  }, [items, isLoaded]);

  const addItem = useCallback(
    (product: Product, variant?: ProductVariant, quantity: number = 1) => {
      setItems((prev) => {
        const itemKey = getItemKey(product.id, variant?.id);
        const existing = prev.find(
          (item) =>
            getItemKey(item.product.id, item.variant?.id) === itemKey
        );
        if (existing) {
          return prev.map((item) =>
            getItemKey(item.product.id, item.variant?.id) === itemKey
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { product, variant, quantity }];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          getItemKey(item.product.id, item.variant?.id) !==
          getItemKey(productId, variantId)
      )
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantId?: string) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          getItemKey(item.product.id, item.variant?.id) ===
          getItemKey(productId, variantId)
            ? { ...item, quantity }
            : item
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    isLoaded,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
  };
}
