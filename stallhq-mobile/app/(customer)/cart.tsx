import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
  TextInput, Modal, Linking,
} from "react-native";
import { alert } from "../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCart, CartItem } from "../../lib/cart";
import { Colors, FontSize, Spacing, BorderRadius } from "../../lib/theme";
import { WEB_API_URL } from "../../lib/auth";
import {
  ArrowLeft, Trash2, Plus, Minus, MessageCircle, ShoppingBag,
} from "lucide-react-native";

export default function CartScreen() {
  const router = useRouter();
  const { items, total, updateQuantity, removeItem, clearCart, clearStore } = useCart();
  const [orderModal, setOrderModal] = useState(false);
  const [orderStoreSlug, setOrderStoreSlug] = useState("");
  const [orderStoreWhatsapp, setOrderStoreWhatsapp] = useState("");
  const [orderStoreName, setOrderStoreName] = useState("");
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [ordering, setOrdering] = useState(false);

  const storeGroups = items.reduce<Record<string, CartItem[]>>((acc, item) => {
    if (!acc[item.store_id]) acc[item.store_id] = [];
    acc[item.store_id].push(item);
    return acc;
  }, {});

  const openOrderForStore = (storeId: string) => {
    const storeItems = storeGroups[storeId];
    if (!storeItems.length) return;
    setOrderStoreSlug(storeItems[0].store_slug);
    setOrderStoreWhatsapp(storeItems[0].store_whatsapp);
    setOrderStoreName(storeItems[0].store_name);
    setOrderItems(storeItems);
    setCustomerName("");
    setCustomerPhone("");
    setOrderNotes("");
    setOrderModal(true);
  };

  const storeTotal = (storeId: string) =>
    storeGroups[storeId].reduce((s, i) => s + i.price * i.quantity, 0);

  const formatOrderMessage = (items: CartItem[], storeName: string) => {
    const lines = items.map((i) => {
      const variant = "";
      return `*${i.product_name}*${variant} — ₦${i.price.toLocaleString()}\nQty: ${i.quantity}`;
    });
    const storeTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    let msg = `Hi ${storeName}! I'd like to order:\n\n${lines.join("\n\n")}\n\nTotal: ₦${storeTotal.toLocaleString()}`;
    if (orderNotes.trim()) msg += `\n\nNote: ${orderNotes.trim()}`;
    return msg;
  };

  const submitOrder = async () => {
    if (!customerName.trim()) {
      alert("Missing name", "Enter your name for the order.");
      return;
    }
    setOrdering(true);
    try {
      const orderPayload = {
        store_id: orderItems[0]?.store_id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        items: orderItems.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          price: i.price,
          quantity: i.quantity,
        })),
        total: orderItems.reduce((s, i) => s + i.price * i.quantity, 0),
        notes: orderNotes.trim() || null,
      };

      const res = await fetch(`${WEB_API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const d = await res.json();
        alert("Order failed", d.error || "Please try again.");
        return;
      }

      const order = await res.json();
      const msg = formatOrderMessage(orderItems, orderStoreName);
      const num = orderStoreWhatsapp.replace(/[^0-9]/g, "");

      clearStore(orderItems[0].store_id);
      setOrderModal(false);

      alert(
        "Order placed!",
        `Order #${String(order.id).slice(0, 8)} created. Opening WhatsApp to send your order…`,
        [
          {
            text: "Open WhatsApp",
            onPress: () => {
              Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`);
            },
          },
          { text: "Later", style: "cancel" },
        ]
      );
    } catch {
      alert("Network error", "Please check your connection.");
    } finally {
      setOrdering(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color={Colors.purple} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.emptyState}>
          <ShoppingBag size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Cart is empty</Text>
          <Text style={styles.emptySub}>Browse stores and add products to your cart</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.back()}>
            <Text style={styles.browseBtnText}>Browse stores</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.purple} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart ({items.length})</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {Object.entries(storeGroups).map(([storeId, storeItems]) => (
          <View key={storeId} style={styles.storeGroup}>
            <View style={styles.storeGroupHeader}>
              <Text style={styles.storeGroupName}>{storeItems[0].store_name}</Text>
              <TouchableOpacity onPress={() => clearStore(storeId)}>
                <Trash2 size={14} color={Colors.red} />
              </TouchableOpacity>
            </View>

            {storeItems.map((item) => (
              <View key={item.product_id} style={styles.cartItem}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Text style={{ color: Colors.textMuted, fontSize: 10 }}>No img</Text>
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                  <Text style={styles.itemPrice}>₦{item.price.toLocaleString()}</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.product_id, item.quantity - 1)}
                    >
                      <Minus size={14} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
                    >
                      <Plus size={14} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemTotal}>₦{(item.price * item.quantity).toLocaleString()}</Text>
                  <TouchableOpacity onPress={() => removeItem(item.product_id)}>
                    <Trash2 size={14} color={Colors.red} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.storeFooter}>
              <Text style={styles.storeTotal}>Subtotal: ₦{storeTotal(storeId).toLocaleString()}</Text>
              <TouchableOpacity
                style={styles.orderBtn}
                onPress={() => openOrderForStore(storeId)}
                activeOpacity={0.8}
              >
                <MessageCircle size={16} color="#fff" />
                <Text style={styles.orderBtnText}>Order via WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.totalBar}>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
        </View>
      </ScrollView>

      {/* Order Modal */}
      <Modal visible={orderModal} transparent animationType="slide" onRequestClose={() => setOrderModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order from {orderStoreName}</Text>
              <TouchableOpacity onPress={() => setOrderModal(false)}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {orderItems.map((item) => (
                <View key={item.product_id} style={styles.modalItem}>
                  <Text style={styles.modalItemName} numberOfLines={1}>{item.product_name}</Text>
                  <Text style={styles.modalItemQty}>x{item.quantity}</Text>
                  <Text style={styles.modalItemPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}

              <View style={styles.modalDivider} />
              <View style={styles.modalItem}>
                <Text style={styles.modalTotalLabel}>Total</Text>
                <Text style={styles.modalTotalValue}>₦{orderItems.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}</Text>
              </View>

              <Text style={styles.fieldLabel}>Your name *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textMuted}
                value={customerName}
                onChangeText={setCustomerName}
                maxLength={100}
              />

              <Text style={styles.fieldLabel}>Phone (optional)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Phone number"
                placeholderTextColor={Colors.textMuted}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
                maxLength={20}
              />

              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.fieldInput, { minHeight: 60, textAlignVertical: "top" }]}
                placeholder="Special instructions..."
                placeholderTextColor={Colors.textMuted}
                value={orderNotes}
                onChangeText={setOrderNotes}
                multiline
                maxLength={500}
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitOrderBtn, ordering && { opacity: 0.6 }]}
              onPress={submitOrder}
              disabled={ordering}
              activeOpacity={0.8}
            >
              <MessageCircle size={18} color="#fff" />
              <Text style={styles.submitOrderText}>
                {ordering ? "Placing order..." : "Place order & open WhatsApp"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: Spacing.lg, paddingBottom: Spacing.sm,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: FontSize.md, color: Colors.purple },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  clearText: { fontSize: FontSize.sm, color: Colors.red, fontWeight: "600" },
  scroll: { padding: Spacing.lg, paddingTop: 0 },
  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center",
    gap: 12, paddingBottom: 80,
  },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textSecondary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center" },
  browseBtn: {
    marginTop: Spacing.md, backgroundColor: Colors.purpleDim,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
  },
  browseBtnText: { color: Colors.purple, fontWeight: "700", fontSize: FontSize.sm },
  storeGroup: {
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  storeGroupHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  storeGroupName: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  cartItem: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderSubtle,
  },
  itemImage: { width: 56, height: 56, borderRadius: BorderRadius.sm },
  itemImagePlaceholder: {
    backgroundColor: Colors.bgSecondary, alignItems: "center", justifyContent: "center",
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.text },
  itemPrice: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: Spacing.xs },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCard, alignItems: "center", justifyContent: "center",
  },
  qtyText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text, minWidth: 20, textAlign: "center" },
  itemRight: { alignItems: "flex-end", gap: Spacing.sm },
  itemTotal: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.green },
  storeFooter: { marginTop: Spacing.md, gap: Spacing.sm },
  storeTotal: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, textAlign: "right" },
  orderBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#25d366", borderRadius: BorderRadius.lg, padding: Spacing.md,
  },
  orderBtnText: { color: "#fff", fontSize: FontSize.sm, fontWeight: "700" },
  totalBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: 40,
  },
  totalLabel: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  totalValue: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.green },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: Colors.bgSecondary, borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xxl, paddingBottom: 44,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  modalClose: { fontSize: FontSize.sm, color: Colors.textMuted },
  modalItem: {
    flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm,
  },
  modalItemName: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  modalItemQty: { fontSize: FontSize.sm, color: Colors.textMuted, marginHorizontal: Spacing.md },
  modalItemPrice: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.text },
  modalDivider: { height: 1, backgroundColor: Colors.borderSubtle, marginVertical: Spacing.sm },
  modalTotalLabel: { flex: 1, fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  modalTotalValue: { fontSize: FontSize.md, fontWeight: "800", color: Colors.green },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary, marginTop: Spacing.md },
  fieldInput: {
    backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.sm, color: Colors.text,
  },
  submitOrderBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#25d366", borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  submitOrderText: { color: "#fff", fontSize: FontSize.md, fontWeight: "700" },
});
