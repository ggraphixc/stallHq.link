import React, { useState } from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { Colors, FontSize, Spacing, BorderRadius } from "../lib/theme";
import { WEB_API_URL } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Download } from "lucide-react-native";

interface Props {
  storeId: string;
  period?: number;
}

/**
 * CSV export button for vendor analytics.
 * Downloads a CSV file with daily analytics data.
 */
export function CsvExportButton({ storeId, period = 30 }: Props) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const url = `${WEB_API_URL}/api/analytics/export?store_id=${storeId}&period=${period}`;

      if (Platform.OS === "web") {
        // Web: trigger download via hidden link
        const response = await fetch(url, {
          headers: { "x-access-token": session.access_token },
        });
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `stallhq-analytics-${period}d.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      } else {
        // Native: use expo-file-system + sharing
        const FileSystem = require("expo-file-system");
        const Sharing = require("expo-sharing");

        const fileUri = `${FileSystem.documentDirectory}stallhq-analytics-${period}d.csv`;
        const downloadRes = FileSystem.createDownloadResumable(
          url,
          fileUri,
          { headers: { "x-access-token": session.access_token } }
        );

        const { uri } = await downloadRes.downloadAsync();
        if (uri && await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }
      }
    } catch (err) {
      console.warn("[csv-export] error:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Pressable style={styles.btn} onPress={handleExport} disabled={exporting}>
      {exporting ? (
        <ActivityIndicator size="small" color={Colors.purple} />
      ) : (
        <Download size={14} color={Colors.purple} />
      )}
      <Text style={styles.btnText}>{exporting ? "Exporting..." : "Export CSV"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.purple + "40",
    backgroundColor: Colors.purpleDim,
  },
  btnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.purple,
  },
});
