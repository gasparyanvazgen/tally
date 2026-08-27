import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client for use in Server Components, Route
// Handlers, and Server Actions. Reads the session from request cookies
// (kept fresh by the middleware) instead of from browser storage, so the
// server sees the same authenticated user the browser does.
//
// Server Components can't write cookies (Next.js will throw), so the
// `setAll` call below is wrapped in a try/catch — middleware.ts is what
// actually persists a refreshed session; this call is a no-op there.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render — ignore, middleware
            // handles refreshing the session cookie on the request/response.
          }
        },
      },
    },
  );
}