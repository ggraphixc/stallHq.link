"use client";

import { Store, Product } from "@/types";
import { StorePage } from "./StorePage";

const DEMO_STORE: Store = {
  id: "demo-store-id",
  slug: "demo-store",
  name: "Shivam's Fashion Hub",
  description: "Premium fashion items for the modern lifestyle",
  whatsapp_number: "+2348000000000",
  logo_url: null,
  banner_url: null,
  created_at: new Date().toISOString(),
};

const DEMO_PRODUCTS: Product[] = [
  {
    id: "1",
    store_id: "demo-store-id",
    name: "Premium Cotton T-Shirt",
    description: "Soft, breathable cotton t-shirt available in multiple colors",
    price: 4500,
    image_url: null,
    category: "Tops",
    in_stock: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    store_id: "demo-store-id",
    name: "Slim Fit Denim Jeans",
    description: "Classic slim fit jeans with stretch comfort",
    price: 12000,
    image_url: null,
    category: "Bottoms",
    in_stock: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    store_id: "demo-store-id",
    name: "Casual Sneakers",
    description: "Comfortable everyday sneakers for all occasions",
    price: 8500,
    image_url: null,
    category: "Footwear",
    in_stock: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    store_id: "demo-store-id",
    name: "Leather Crossbody Bag",
    description: "Genuine leather bag with adjustable strap",
    price: 15000,
    image_url: null,
    category: "Accessories",
    in_stock: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    store_id: "demo-store-id",
    name: "Oversized Hoodie",
    description: "Cozy oversized hoodie perfect for cooler evenings",
    price: 9500,
    image_url: null,
    category: "Tops",
    in_stock: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    store_id: "demo-store-id",
    name: "Aviator Sunglasses",
    description: "UV400 protection with classic aviator design",
    price: 3500,
    image_url: null,
    category: "Accessories",
    in_stock: true,
    created_at: new Date().toISOString(),
  },
];

export default function DemoStorePage() {
  return <StorePage store={DEMO_STORE} products={DEMO_PRODUCTS} />;
}
