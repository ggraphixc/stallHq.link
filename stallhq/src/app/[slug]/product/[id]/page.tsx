import { notFound } from "next/navigation";
import { getProductById } from "@/lib/supabase";
import { ProductDetail } from "./ProductDetail";

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const product = await getProductById(id);
    return {
      title: `${product.name} | ${product.stores.name}`,
      description: product.description || `Shop ${product.name} on stallHq`,
      openGraph: {
        title: product.name,
        description: product.description || `Shop ${product.name}`,
        images: product.image_url ? [product.image_url] : [],
      },
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function ProductRoute({ params }: PageProps) {
  const { id } = await params;

  try {
    const product = await getProductById(id);
    return <ProductDetail product={product} />;
  } catch {
    notFound();
  }
}
