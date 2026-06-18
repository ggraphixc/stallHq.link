import { notFound } from "next/navigation";
import { getStoreBySlug, getProductsByStoreId } from "@/lib/supabase";
import { StorePage } from "./StorePage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const store = await getStoreBySlug(slug);
    return {
      title: `${store.name} | stallHq`,
      description: store.description || `Shop from ${store.name} on stallHq`,
      openGraph: {
        title: store.name,
        description: store.description || `Shop from ${store.name}`,
        images: store.banner_url ? [store.banner_url] : [],
      },
    };
  } catch {
    return { title: "Store Not Found" };
  }
}

export default async function StoreRoute({ params }: PageProps) {
  const { slug } = await params;

  try {
    const store = await getStoreBySlug(slug);
    const products = await getProductsByStoreId(store.id);

    return <StorePage store={store} products={products} />;
  } catch {
    notFound();
  }
}
