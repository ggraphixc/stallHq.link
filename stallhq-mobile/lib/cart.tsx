import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "./supabase";

const CART_KEY = "stallhq_cart";

export interface CartItem {
  product_id: string;
  product_name: string;
  image_url: string | null;
  price: number;
  quantity: number;
  store_id: string;
  store_name: string;
  store_slug: string;
  store_whatsapp: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (product: Product, store: { id: string; name: string; slug: string; whatsapp_number: string }, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  clearStore: (storeId: string) => void;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  itemCount: 0,
  total: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  clearStore: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((raw) => {
      if (raw) {
        try { setItems(JSON.parse(raw)); } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItem = useCallback(
    (product: Product, store: { id: string; name: string; slug: string; whatsapp_number: string }, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.product_id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product_id === product.id ? { ...i, quantity: i.quantity + qty } : i
          );
        }
        return [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            image_url: product.image_url,
            price: product.price,
            quantity: qty,
            store_id: store.id,
            store_name: store.name,
            store_slug: store.slug,
            store_whatsapp: store.whatsapp_number,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const clearStore = useCallback((storeId: string) => {
    setItems((prev) => prev.filter((i) => i.store_id !== storeId));
  }, []);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, itemCount, total, addItem, removeItem, updateQuantity, clearCart, clearStore }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
