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
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
    const isApiRoute = request.nextUrl.pathname.startsWith("/api");
    const isPublicPage = request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/demo-store";
    const needsAuth = !isAuthRoute && !isApiRoute && !isPublicPage;

    if (!user && needsAuth) {
      console.log("[Middleware] No user, redirecting to login. Path:", request.nextUrl.pathname, "Cookies:", request.cookies.getAll().map(c => c.name));
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    if (user) {
      console.log("[Middleware] User authenticated:", user.email, "Path:", request.nextUrl.pathname);
    }
  } catch (e) {
    console.error("[Middleware] error:", e);
  }

  return supabaseResponse;
}
