"use client";

// Re-export useCart from CartContext for backward compatibility.
// All components that import from @/hooks/useCart will automatically
// use the shared context when inside a CartProvider, or fall back
// to a standalone hook when outside one.
export { useCart } from "@/contexts/CartContext";
