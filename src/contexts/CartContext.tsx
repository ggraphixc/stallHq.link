"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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

function getItemKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}-${variantId}` : productId;
}

interface CartContextValue {
  items: CartItem[];
  isLoaded: boolean;
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setItems(getStoredCart());
    setIsLoaded(true);

    // Cross-tab sync via storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) {
        const newItems = e.newValue ? JSON.parse(e.newValue) : [];
        setItems(newItems);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
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
          (item) => getItemKey(item.product.id, item.variant?.id) === itemKey
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
        (item) => getItemKey(item.product.id, item.variant?.id) !== getItemKey(productId, variantId)
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
          getItemKey(item.product.id, item.variant?.id) === getItemKey(productId, variantId)
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

  return (
    <CartContext.Provider
      value={{ items, isLoaded, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    // Fallback for components outside CartProvider (e.g. OrderDetail reorder)
    return useCartFallback();
  }
  return ctx;
}

// Fallback hook for components that use cart outside the provider
function useCartFallback() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setItems(getStoredCart());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) saveStoredCart(items);
  }, [items, isLoaded]);

  const addItem = useCallback((product: Product, variant?: ProductVariant, quantity = 1) => {
    setItems((prev) => {
      const key = getItemKey(product.id, variant?.id);
      const existing = prev.find((i) => getItemKey(i.product.id, i.variant?.id) === key);
      if (existing) {
        return prev.map((i) => getItemKey(i.product.id, i.variant?.id) === key ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { product, variant, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((prev) => prev.filter((i) => getItemKey(i.product.id, i.variant?.id) !== getItemKey(productId, variantId)));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) { removeItem(productId, variantId); return; }
    setItems((prev) => prev.map((i) => getItemKey(i.product.id, i.variant?.id) === getItemKey(productId, variantId) ? { ...i, quantity } : i));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);
  const total = items.reduce((s, i) => s + (i.variant?.price ?? i.product.price) * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return { items, isLoaded, addItem, removeItem, updateQuantity, clearCart, total, itemCount };
}
