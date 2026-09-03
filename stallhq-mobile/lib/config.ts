// Base URL of the stallHq web API (Next.js). The mobile app authenticates to
// these endpoints with a Supabase access token sent as `x-access-token`.
export const WEB_API_URL =
  process.env.EXPO_PUBLIC_WEB_API_URL || "https://hqlink.vercel.app";
