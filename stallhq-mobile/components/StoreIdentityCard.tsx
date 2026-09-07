import React from "react";
import { View, Text, Image, TouchableOpacity, Linking } from "react-native";
import { Store as StoreIcon, Clock, MessageCircle, Link as LinkIcon, Mail } from "lucide-react-native";
import { useThemeStyles, Colors, FontSize, Spacing, BorderRadius } from "../lib/theme";
import type { Store } from "../lib/supabase";

interface StoreIdentityCardProps {
  store: Store;
  /** If true and the viewer is the store owner, show an "Edit" action to open your own store's profile editor. */
  editable?: boolean;
  /** tappable action when the viewer is the owner (typically opens /vendor/profile). */
  onEdit?: () => void;
  /** When supplied, the card is shown as the "public" view (customer viewing a store). */
  compact?: boolean;
}

function HoursChip({ hours }: { hours?: { open?: string; close?: string; closed?: boolean; label?: string } }) {
  const styles = useThemeStyles(makeStyles);
  if (!hours) return null;
  if (hours.closed) {
    return (
      <View style={styles.hoursBadgeClosed}>
        <Clock size={11} color={Colors.red} />
        <Text style={[styles.hoursText, { color: Colors.red }]}>Closed</Text>
      </View>
    );
  }
  return (
    <View style={styles.hoursBadge}>
      <Clock size={11} color={Colors.green} />
      <Text style={[styles.hoursText, { color: Colors.green }]}>
        {hours.label ?? `${hours.open ?? ""}–${hours.close ?? ""}`}
      </Text>
    </View>
  );
}

export function StoreIdentityCard({ store, editable, onEdit }: StoreIdentityCardProps) {
  const styles = useThemeStyles(makeStyles);
  const num = store.whatsapp_number ? store.whatsapp_number.replace(/[^0-9]/g, "") : "";

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {store.logo_url ? (
          <Image source={{ uri: store.logo_url }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <StoreIcon size={24} color={Colors.textMuted} />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={styles.name} numberOfLines={1}>{store.name}</Text>
          <Text style={styles.slug}>stallhq.link/{store.slug}</Text>
          {store.description ? (
            <Text style={styles.description} numberOfLines={2}>{store.description}</Text>
          ) : null}
        </View>
        {editable && onEdit ? (
          <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.7}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Contact row */}
      <View style={styles.contactRow}>
        {store.whatsapp_number ? (
          <TouchableOpacity style={styles.contactChip} onPress={() => {
            Linking.openURL(`https://wa.me/${num}?text=Hi%20${encodeURIComponent(store.name)}!`);
          }} activeOpacity={0.7}>
            <MessageCircle size={13} color={Colors.green} />
            <Text style={[styles.contactText, { color: Colors.green }]}>WhatsApp</Text>
          </TouchableOpacity>
        ) : null}
        {store.instagram_handle ? (
          <TouchableOpacity style={styles.contactChip} onPress={() => {
            const handle = store.instagram_handle!.replace(/^@/, "");
            Linking.openURL(`https://instagram.com/${handle}`);
          }} activeOpacity={0.7}>
            <LinkIcon size={13} color={Colors.purple} />
            <Text style={[styles.contactText, { color: Colors.purple }]}>
              @{store.instagram_handle.replace(/^@/, "")}
            </Text>
          </TouchableOpacity>
        ) : null}
        {!store.whatsapp_number && !store.instagram_handle && (
          <View style={[styles.contactChip, { opacity: 0.4 }]}>
            <Text style={[styles.contactText, { color: Colors.textMuted }]}>No contact channels</Text>
          </View>
        )}
      </View>

      {/* Hours + email */}
      <View style={styles.row}>
        {store.store_hours?.enabled ? (
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Open today</Text>
            <HoursChip hours={store.store_hours.days?.[["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()] as keyof typeof store.store_hours.days] as any} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Open hours</Text>
            <Text style={styles.rowMuted}>Not set</Text>
          </View>
        )}
        {store.email ? (
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${store.email}`)} activeOpacity={0.7}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={[styles.rowValue, { color: Colors.cyan }]}>{store.email}</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = () => {
  const s = useThemeStyles(() => ({
    card: {
      backgroundColor: Colors.bgCard,
      borderWidth: 1,
      borderColor: Colors.borderSubtle,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    logo: { width: 56, height: 56, borderRadius: BorderRadius.md },
    logoPlaceholder: {
      width: 56, height: 56, borderRadius: BorderRadius.md,
      backgroundColor: Colors.bgSecondary, alignItems: "center" as const, justifyContent: "center" as const,
    },
    name: { fontSize: FontSize.xl, fontWeight: "700" as const, color: Colors.text },
    slug: { fontSize: FontSize.sm, color: Colors.textMuted },
    description: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, lineHeight: 20 },
    editBtn: {
      marginLeft: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.purpleDim,
      borderWidth: 1,
      borderColor: Colors.borderGlow,
      alignItems: "center" as const,
    },
    editText: { fontSize: FontSize.xs, fontWeight: "700" as const, color: Colors.purple },
    contactRow: { flexDirection: "row" as const, gap: Spacing.sm, marginTop: Spacing.md },
    contactChip: {
      flexDirection: "row" as const, alignItems: "center" as const, gap: 5,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md, backgroundColor: Colors.bgSecondary,
      borderWidth: 1, borderColor: Colors.borderSubtle,
    },
    contactText: { fontSize: FontSize.xs, fontWeight: "600" as const },
    row: { flexDirection: "row" as const, alignItems: "center" as const, marginTop: Spacing.md },
    rowLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: "uppercase" as const, letterSpacing: 0.05, marginBottom: 2 },
    rowValue: { fontSize: FontSize.sm, fontWeight: "600" as const, color: Colors.text },
    rowMuted: { fontSize: FontSize.sm, color: Colors.textMuted },
    hoursBadge: {
      flexDirection: "row" as const, alignItems: "center" as const, gap: 5,
      marginTop: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.md, backgroundColor: Colors.greenDim,
      borderWidth: 1, borderColor: "rgba(16,185,129,0.15)",
    },
    hoursBadgeClosed: {
      flexDirection: "row" as const, alignItems: "center" as const, gap: 5,
      marginTop: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.md, backgroundColor: Colors.redDim,
      borderWidth: 1, borderColor: "rgba(239,68,68,0.15)",
    },
    hoursText: { fontSize: FontSize.xs, fontWeight: "600" as const },
  }));
  return s;
};