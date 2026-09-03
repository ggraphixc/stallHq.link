import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Types matching actual database schema ───

export interface StoreTheme {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  cardBackground?: string;
  textColor?: string;
}

export interface StoreHours {
  enabled: boolean;
  days: Record<string, { open: string; close: string; closed: boolean }>;
}

export type SubscriptionPlan = "trial" | "monthly" | "quarterly" | "annual";

export interface Store {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  description: string | null;
  whatsapp_number: string;
  instagram_handle: string | null;
  logo_url: string | null;
  banner_url: string | null;
  category: string | null;
  email: string | null;
  theme: StoreTheme | null;
  store_hours: StoreHours | null;
  setup_complete: boolean;
  plan: SubscriptionPlan;
  verified: boolean;
  trial_ends_at: string | null;
  subscription_expires_at: string | null;
  low_stock_threshold: number;
  stock_alerts_enabled: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  images: string[];
  category: string | null;
  in_stock: boolean;
  has_variants: boolean;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_name?: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  store_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  items: OrderItem[];
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  notes: string | null;
  vendor_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsRecord {
  id: string;
  store_id: string;
  date: string;
  visits: number;
  clicks: number;
  orders: number;
  revenue: number;
}
