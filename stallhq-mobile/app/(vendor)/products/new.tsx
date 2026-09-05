import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { alert } from "../../../lib/alert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { Colors, FontSize, Spacing, BorderRadius, ambientInput, labelStyle } from "../../../lib/theme";
import { ArrowLeft, Package } from "lucide-react-native";

export default function NewProductScreen() {
  const router = useRouter();
  const { store } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !price) { alert("Error", "Name and price are required"); return; }
    setLoading(true);
    const { error } = await supabase.from("products").insert({
      store_id: store?.id, name: name.trim(), description: description.trim() || null,
      price: parseFloat(price), category: category.trim() || null, in_stock: true, images: [],
    });
    setLoading(false);
    if (error) alert("Error", error.message); else router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color={Colors.purple} /><Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}><Package size={20} color={Colors.purple} /></View>
            <Text style={styles.title}>Add Product</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Ankara Dress" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your product..." placeholderTextColor={Colors.textMuted}
              value={description} onChangeText={setDescription} multiline numberOfLines={3} textAlignVertical="top" />

            <Text style={styles.label}>Price (₦) *</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={price} onChangeText={setPrice} keyboardType="numeric" />

            <Text style={styles.label}>Category</Text>
            <TextInput style={styles.input} placeholder="e.g. Clothing, Electronics" placeholderTextColor={Colors.textMuted} value={category} onChangeText={setCategory} />

            <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading} activeOpacity={0.7}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Product</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scroll: { padding: Spacing.lg },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: Spacing.lg },
  backText: { fontSize: FontSize.md, color: Colors.purple },
  headerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.xxl },
  headerIcon: { width: 40, height: 40, borderRadius: BorderRadius.lg, backgroundColor: Colors.purpleDim, justifyContent: "center", alignItems: "center" },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  form: { gap: Spacing.md },
  label: { ...labelStyle, marginBottom: Spacing.xs },
  input: { ...ambientInput, padding: Spacing.lg, fontSize: FontSize.md },
  textArea: { minHeight: 80, paddingTop: Spacing.md },
  button: { backgroundColor: Colors.purple, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: "center", marginTop: Spacing.lg },
  buttonText: { color: "#fff", fontSize: FontSize.lg, fontWeight: "700" },
});
