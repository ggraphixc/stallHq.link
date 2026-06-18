import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  // TODO: Get store from auth session
  // For now, we'll show the create store form
  const store = null;
  const products = [];

  return <DashboardClient store={store} products={products} />;
}
