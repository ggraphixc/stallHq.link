import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";
import { BrandLoader } from "../components/BrandLoader";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return <BrandLoader label="Opening stallHq" />;
  }

  if (session) {
    return <Redirect href="/(vendor)/(tabs)" />;
  }

  return <Redirect href="/(auth)/select-role" />;
}
