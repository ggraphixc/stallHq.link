export interface StoreTheme {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  cardBackground?: string;
  textColor?: string;
  fontHeading?: string;
  fontBody?: string;
}

export interface StoreHours {
  enabled: boolean;
  days: {
    mon: { open: string; close: string; closed: boolean };
    tue: { open: string; close: string; closed: boolean };
    wed: { open: string; close: string; closed: boolean };
    thu: { open: string; close: string; closed: boolean };
    fri: { open: string; close: string; closed: boolean };
    sat: { open: string; close: string; closed: boolean };
    sun: { open: string; close: string; closed: boolean };
  };
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

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  option_name: string;
  option_value: string;
  price: number | null;
  stock: number;
  sku: string | null;
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
  variants?: ProductVariant[];
  created_at: string;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
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

export interface Review {
  id: string;
  product_id: string;
  store_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id?: string;
}

export interface ProductWithRating extends Product {
  review_count?: number;
  avg_rating?: number;
}
