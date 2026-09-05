import React, { useEffect, useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Heart } from "lucide-react-native";
import { Colors } from "../lib/theme";
import { addProductFavorite, removeProductFavorite, isProductFavorited } from "../lib/productFavorites";

interface Props {
  productId: string;
  storeId: string;
  size?: number;
}

export function ProductFavoriteButton({ productId, storeId, size = 18 }: Props) {
  const [faved, setFaved] = useState(false);

  useEffect(() => {
    isProductFavorited(productId).then(setFaved);
  }, [productId]);

  const toggle = async () => {
    if (faved) {
      const ok = await removeProductFavorite(productId);
      if (ok) setFaved(false);
    } else {
      const ok = await addProductFavorite(productId, storeId);
      if (ok) setFaved(true);
    }
  };

  return (
    <TouchableOpacity style={styles.btn} onPress={toggle} activeOpacity={0.7}>
      <Heart size={size} color={faved ? Colors.red : Colors.textMuted} fill={faved ? Colors.red : "none"} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(19,19,29,0.8)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
});
