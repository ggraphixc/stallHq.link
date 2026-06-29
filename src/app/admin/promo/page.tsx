"use client";

import dynamic from "next/dynamic";

const PromoAdmin = dynamic(() => import("./PromoAdmin"), { ssr: false });

export default function AdminPromoPage() {
  return <PromoAdmin />;
}
