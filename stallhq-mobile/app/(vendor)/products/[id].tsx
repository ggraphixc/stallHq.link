import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, Linking,
} from "react-native";
import { alert } from "../../../lib/alert";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase, Product } from "../../../lib/supabase";
import { BrandLoader } from "../../../components/BrandLoader";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput, labelStyle } from "../../../lib/theme";
import { ArrowLeft, Save, Trash2, Package, Eye } from "lucide-react-native";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [inStock, setInStock] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    supabase.from("products").select("*").eq("id", id).single()
      .then(({ data }) => {
        if (cancelled) return;
        const p = data as Product;
        setProduct(p);
        if (p) {
          setName(p.name);
          setDescription(p.description ?? "");
          setPrice(String(p.price));
          setCategory(p.category ?? "");
          setInStock(p.in_stock);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleSave = async () => {
    if (!name.trim() || !price || !product) { alert("Error", "Name and price are required"); return; }
    setSaving(true);
    const { error } = await supabase.from("products").update({
      name: name.trim(),
      description: description.trim() || null,
      price: parseFloat(price),
      category: category.trim() || null,
      in_stock: inStock,
    }).eq("id", product.id);
    setSaving(false);
    if (error) alert("Error", error.message);
    else {
      alert("Saved", "Product updated successfully");
      setIsEditing(false);
      setProduct({ ...product, name: name.trim(), description: description.trim() || null, price: parseFloat(price), category: category.trim() || null, in_stock: inStock });
    }
  };

  const handleDelete = () => {
    if (!product) return;
    alert("Delete Product", `Delete "${product.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await supabase.from("products").delete().eq("id", product.id);
        router.back();
      }},
    ]);
  };

  const toggleStock = async () => {
    if (!product) return;
    const newVal = !inStock;
    setInStock(newVal);
    await supabase.from("products").update({ in_stock: newVal }).eq("id", product.id);
    setProduct({ ...product, in_stock: newVal });
  };

  if (loading || !product) {
    return <BrandLoader label="Loading product" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={18} color={Colors.purple} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => { setIsEditing(!isEditing); }}
            >
              <Text style={styles.editBtnText}>{isEditing ? "Cancel" : "Edit"}</Text>
            </TouchableOpacity>
          </View>

          {/* Image */}
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Package size={48} color={Colors.textMuted} />
            </View>
          )}

          {/* View mode */}
          {!isEditing ? (
            <>
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <View style={[styles.stockBadge, { backgroundColor: product.in_stock ? Colors.greenDim : Colors.redDim }]}>
                    <Text style={[styles.stockText, { color: product.in_stock ? Colors.green : Colors.red }]}>
                      {product.in_stock ? "In Stock" : "Out of Stock"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.price}>₦{product.price.toLocaleString()}</Text>
                {product.category && (
                  <View style={styles.categoryChip}><Text style={styles.categoryText}>{product.category}</Text></View>
                )}
              </View>

              {product.description && (
                <View style={styles.card}>
                  <Text style={styles.label}>DESCRIPTION</Text>
                  <Text style={styles.descriptionText}>{product.description}</Text>
                </View>
              )}

              <View style={styles.card}>
                <Text style={styles.label}>PRODUCT INFO</Text>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Price</Text><Text style={styles.infoValue}>₦{product.price.toLocaleString()}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Category</Text><Text style={styles.infoValue}>{product.category ?? "—"}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Status</Text><Text style={styles.infoValue}>{product.in_stock ? "Visible in store" : "Hidden from store"}</Text></View>
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.borderSubtle }]} onPress={toggleStock}>
                  <Eye size={16} color={Colors.cyan} />
                  <Text style={styles.actionText}>{product.in_stock ? "Hide Product" : "Show Product"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.red, borderWidth: 1 }]} onPress={handleDelete}>
                  <Trash2 size={16} color={Colors.red} />
                  <Text style={[styles.actionText, { color: Colors.red }]}>Delete</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.viewStoreLink}>
                <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs }}>
                  Created {new Date(product.created_at).toLocaleDateString()}
                </Text>
              </View>
            </>
          ) : (
            /* Edit mode */
            <View style={styles.form}>
              <Text style={styles.heading}>Edit Product</Text>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={Colors.textMuted} />

              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription}
                multiline numberOfLines={4} textAlignVertical="top" placeholderTextColor={Colors.textMuted} />

              <Text style={styles.label}>Price (₦) *</Text>
              <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />

              <Text style={styles.label}>Category</Text>
              <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholderTextColor={Colors.textMuted} />

              <TouchableOpacity style={styles.toggleRow} onPress={toggleStock}>
                <Text style={[styles.label, { marginBottom: 0 }]}>Available in store</Text>
                <View style={[styles.toggle, inStock && styles.toggleOn]}>
                  <View style={[styles.toggleKnob, inStock && styles.toggleKnobOn]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <><Save size={16} color="#fff" /><Text style={styles.saveText}>Save Changes</Text></>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: FontSize.md, color: Colors.purple },
  editBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.purpleDim, borderWidth: 1, borderColor: Colors.borderGlow,
  },
  editBtnText: { color: Colors.purple, fontWeight: "600", fontSize: FontSize.sm },
  heroImage: { width: "100%", height: 220, borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  heroPlaceholder: {
    width: "100%", height: 220, borderRadius: BorderRadius.lg, marginBottom: Spacing.lg,
    backgroundColor: Colors.bgCard, justifyContent: "center", alignItems: "center",
  },
  card: { backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  productName: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, flex: 1, marginRight: Spacing.sm },
  stockBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  stockText: { fontSize: FontSize.xs, fontWeight: "600" },
  price: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.green, marginTop: Spacing.sm },
  categoryChip: { alignSelf: "flex-start", marginTop: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm, backgroundColor: Colors.cyanDim },
  categoryText: { fontSize: FontSize.xs, color: Colors.cyan, fontWeight: "600" },
  label: { ...labelStyle, marginBottom: Spacing.sm },
  descriptionText: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  infoValue: { fontSize: FontSize.sm, color: Colors.text, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "rgba(19,19,29,0.6)", borderWidth: 1, borderRadius: BorderRadius.lg,
    paddingVertical: 14,
  },
  actionText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: "600" },
  viewStoreLink: { alignItems: "center", marginTop: Spacing.lg, paddingVertical: Spacing.md },
  form: { gap: Spacing.md, marginTop: Spacing.sm },
  heading: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginBottom: Spacing.xs },
  input: { ...ambientInput, padding: Spacing.lg, fontSize: FontSize.md },
  textArea: { minHeight: 100, paddingTop: Spacing.md },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: Spacing.sm },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.bgElevated, justifyContent: "center", padding: 2 },
  toggleOn: { backgroundColor: Colors.purple },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.textSecondary },
  toggleKnobOn: { backgroundColor: "#fff", alignSelf: "flex-end" },
  saveBtn: {
    backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: Spacing.sm,
  },
  saveText: { color: "#fff", fontSize: FontSize.md, fontWeight: "700" },
});
