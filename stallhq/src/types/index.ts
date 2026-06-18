export interface Store {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  whatsapp_number: string;
  logo_url: string | null;
  banner_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
