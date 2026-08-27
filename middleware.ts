import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIX = "/app";
const AUTH_PAGES = ["/login", "/signup"];

// Runs on every matched request (see config below), before any page
// renders. Two jobs:
//
// 1. Refresh the Supabase access token if it's expired and rewrite the
//    resulting cookies onto the response — without this, a session can go
//    stale between visits even though AuthContext looks fine in the
//    browser, since only the server round-trip actually refreshes it here.
// 2. Redirect protected/auth pages server-side, so a logged-out user never
//    gets a flash of the dashboard and a logged-in user never gets a flash
//    of the login form before the client-side guards (RequireAuth /
//    RedirectIfAuthed) kick in.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Also validates the token with Supabase (not just decoding it locally),
  // which is why this call — rather than getSession() — is the one to use
  // for anything security-sensitive like a route guard.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith(PROTECTED_PREFIX);
  const isAuthPage = AUTH_PAGES.some(
    (page) => path === page || path.startsWith(`${page}/`),
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Skip static assets and image optimization files — running the session
  // refresh on those would be pure overhead with nothing to protect.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};