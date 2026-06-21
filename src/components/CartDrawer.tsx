"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Minus, Trash2, MessageCircle, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { generateWhatsAppUrl } from "@/lib/whatsapp";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Store } from "@/types";

interface CartDrawerProps {
  store: Store;
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

export function CartDrawer({ store }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
  const { trackWhatsAppClick } = useAnalytics();
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const handleCheckout = async () => {
    trackWhatsAppClick(store.id);
    try {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        variant_id: item.variant?.id,
        variant_name: item.variant ? `${item.variant.option_name}: ${item.variant.option_value}` : undefined,
        price: item.variant?.price ?? item.product.price,
        quantity: item.quantity,
      }));
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          store_name: store.name,
          store_email: store.email,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          customer_email: customerEmail || undefined,
          items: orderItems,
          total,
        }),
      });
    } catch (error) {
      console.error("Error creating order:", error);
    }
    const url = generateWhatsAppUrl(store.whatsapp_number, store.name, items);
    window.open(url, "_blank");
    clearCart();
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          style={{
            ...{
              width: "2.25rem",
              height: "2.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "0.625rem",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              position: "relative" as const,
              color: "white",
              background: "linear-gradient(135deg, #a855f7, #6366f1)",
            },
          }}
          className="icon-button"
          aria-label="Open cart"
        >
          <ShoppingBag size={18} />
          {itemCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-0.25rem",
              right: "-0.25rem",
              width: "1rem",
              height: "1rem",
              borderRadius: "50%",
              background: "var(--glow-green)",
              color: "black",
              fontSize: "0.5625rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}>
              {itemCount}
            </span>
          )}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 50,
        }} />
        <Dialog.Content style={{
          position: "fixed",
          right: 0,
          top: 0,
          height: "100%",
          width: "100%",
          maxWidth: "28rem",
          background: "var(--bg-secondary)",
          border: "none",
          borderLeft: "1px solid var(--border-subtle)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          outline: "none",
        }} className="slide-up">
          {/* Header */}
          <div style={{
            padding: "1.25rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <Dialog.Title style={{ fontSize: "1rem", fontWeight: 700 }}>
              Cart ({itemCount})
            </Dialog.Title>
            <Dialog.Close asChild>
              <button style={{
                width: "2.25rem",
                height: "2.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0.5rem",
                border: "1px solid var(--border-subtle)",
                background: "rgba(255,255,255,0.03)",
                color: "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}>
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Items */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {items.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
                <p style={{ fontSize: "0.875rem" }}>Your cart is empty</p>
              </div>
            ) : (
              items.map((item) => {
                const itemPrice = item.variant?.price ?? item.product.price;
                const itemKey = item.variant?.id ? `${item.product.id}-${item.variant.id}` : item.product.id;
                return (
                  <div key={itemKey} style={{
                    display: "flex",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    {/* Image */}
                    <div style={{
                      width: "4.5rem",
                      height: "4.5rem",
                      borderRadius: "0.5rem",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "var(--bg-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <ShoppingBag size={20} style={{ color: "var(--text-muted)" }} />
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.product.name}
                      </h4>
                      {item.variant && (
                        <p style={{ fontSize: "0.6875rem", color: "var(--glow-purple)", marginTop: "0.125rem" }}>
                          {item.variant.option_name}: {item.variant.option_value}
                        </p>
                      )}
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--glow-green)", marginTop: "0.25rem" }}>
                        ₦{itemPrice.toLocaleString()}
                      </p>

                      {/* Quantity */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)}
                          style={{
                            width: "1.75rem",
                            height: "1.75rem",
                            borderRadius: "0.375rem",
                            background: "var(--bg-primary)",
                            border: "1px solid var(--border-subtle)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                          }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ width: "1.5rem", textAlign: "center", fontSize: "0.8125rem", fontWeight: 600 }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                          style={{
                            width: "1.75rem",
                            height: "1.75rem",
                            borderRadius: "0.375rem",
                            background: "var(--bg-primary)",
                            border: "1px solid var(--border-subtle)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                          }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>

                        <button
                          onClick={() => removeItem(item.product.id, item.variant?.id)}
                          style={{
                            marginLeft: "auto",
                            width: "1.75rem",
                            height: "1.75rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "0.375rem",
                            border: "none",
                            background: "transparent",
                            color: "var(--glow-red)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                          aria-label="Remove item"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div style={{
              padding: "1.25rem",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}>
              {/* Customer info */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.03em", textTransform: "uppercase" }}>
                  Your Info (optional)
                </p>
                <input type="text" placeholder="Your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="ambient-input" style={inputStyle} />
                <input type="tel" placeholder="Phone number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="ambient-input" style={inputStyle} />
                <input type="email" placeholder="Email for order updates" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="ambient-input" style={inputStyle} />
              </div>

              {/* Total */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Total</span>
                <span className="price-display" style={{ fontSize: "1.125rem", fontWeight: 700 }}>₦{total.toLocaleString()}</span>
              </div>

              {/* Checkout */}
              <button onClick={handleCheckout} className="glow-button whatsapp-button" style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}>
                <MessageCircle size={18} />
                Checkout via WhatsApp
              </button>

              <button onClick={clearCart} style={{
                width: "100%",
                padding: "0.5rem",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
              >
                Clear Cart
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
