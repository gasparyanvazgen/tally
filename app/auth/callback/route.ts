import { NextResponse } from "next/server";
import { createClient } from "../../lib/supabase/server";

// Landing point for Supabase email-confirmation and magic-link redirects.
// Supabase appends `?code=...` to whatever URL is configured as the
// redirect target (see the `emailRedirectTo` option passed to `signUp` in
// AuthContext); exchanging that code here sets the session cookies
// server-side so the user arrives at /app already signed in, instead of
// landing on a page with a code in the URL and no session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Missing or invalid code — send them to log in normally instead of
  // stranding them on a broken confirmation link.
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}