import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
            if (headers) {
              Object.entries(headers).forEach(([key, value]) => {
                supabaseResponse.headers.set(key, value);
              });
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
    const isApiRoute = request.nextUrl.pathname.startsWith("/api");
    const isPublicPage = 
      request.nextUrl.pathname === "/" || 
      request.nextUrl.pathname === "/demo-store" ||
      request.nextUrl.pathname === "/explore" ||
      request.nextUrl.pathname === "/favorites" ||
      request.nextUrl.pathname === "/account" ||
      request.nextUrl.pathname === "/offline" ||
      request.nextUrl.pathname === "/profile" ||
      request.nextUrl.pathname.startsWith("/profile/");
    
    // Store pages are public: /{slug} and /{slug}/product/{id}
    // Reserved first-segments are never store slugs.
    const RESERVED = new Set([
      "api", "auth", "admin", "dashboard", "chat", "community", "explore",
      "favorites", "account", "offline", "profile", "demo-store", "offline",
      "settings", "support", "orders", "products", "legal", "sitemap.xml",
      "robots.txt", "favicon.ico", "_next",
    ]);
    const pathParts = request.nextUrl.pathname.split("/").filter(Boolean);
    const isStorePage =
      pathParts.length > 0 &&
      !RESERVED.has(pathParts[0].toLowerCase()) &&
      (pathParts.length === 1 ||
        (pathParts.length === 3 && pathParts[1] === "product"));

    const needsAuth = !isAuthRoute && !isApiRoute && !isPublicPage && !isStorePage;

    if (!user && needsAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }


  } catch (e) {
    console.error("[Middleware] error:", e);
  }

  return supabaseResponse;
}
