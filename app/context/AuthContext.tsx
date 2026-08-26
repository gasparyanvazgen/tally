"use client";

// Real Supabase authentication. Session state comes from supabase-js;
// the `profiles` row is created by the `on_auth_user_created` trigger in
// the initial migration the moment a user signs up, so this file never
// inserts into `profiles` itself — only reads and updates it.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "../lib/supabase/client";
import type { BusinessProfile } from "../types";

interface AuthContextValue {
  isAuthenticated: boolean;
  // True until the initial session check finishes. RequireAuth waits on
  // this instead of redirecting a still-logged-in user to /login on refresh.
  loading: boolean;
  email: string | null;
  profile: BusinessProfile;
  // True right after signUp when the project requires email confirmation
  // and there is therefore no session yet to redirect into /app with.
  needsEmailConfirmation: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    businessName: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: BusinessProfile) => Promise<{ error: string | null }>;
}

const defaultProfile: BusinessProfile = {
  businessName: "Your Business",
  ownerName: "",
  email: "",
  address: "",
};

const AuthContext = createContext<AuthContextValue | null>(null);

function rowToProfile(
  row: { business_name?: string; owner_name?: string; email?: string; address?: string } | null,
  fallbackEmail: string,
): BusinessProfile {
  return {
    businessName: row?.business_name ?? defaultProfile.businessName,
    ownerName: row?.owner_name ?? "",
    email: row?.email ?? fallbackEmail,
    address: row?.address ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Stable across renders so effects below don't re-subscribe every render.
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BusinessProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  useEffect(() => {
    // The trigger creates the profiles row synchronously with the
    // auth.users insert, so it's already there by the time we read it here.
    async function loadProfile(userId: string, fallbackEmail: string) {
      const { data } = await supabase
        .from("profiles")
        .select("business_name, owner_name, email, address")
        .eq("user_id", userId)
        .single();
      setProfile(rowToProfile(data, fallbackEmail));
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id, session.user.email ?? "");
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? "");
      } else {
        setProfile(defaultProfile);
      }
    });

    return () => subscription.unsubscribe();
    // supabase client instance is stable (see useState initializer above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!user,
      loading,
      email: user?.email ?? null,
      profile,
      needsEmailConfirmation,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      // business_name rides along as auth user metadata. Do NOT insert into
      // `profiles` here — the on_auth_user_created trigger already does
      // that from this same metadata, and a second insert on the same
      // user_id primary key would fail.
      signUp: async (email, password, businessName) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: businessName ? { business_name: businessName } : undefined,
          },
        });
        // If the Supabase project requires email confirmation, signUp
        // succeeds but returns no session — nothing to redirect into yet.
        const confirmationNeeded = !error && !data.session;
        setNeedsEmailConfirmation(confirmationNeeded);
        return { error: error?.message ?? null, needsEmailConfirmation: confirmationNeeded };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      // The row itself already exists (created at signup by the trigger);
      // this only ever updates it.
      updateProfile: async (next) => {
        if (!user) return { error: "Not signed in" };
        const { error } = await supabase
          .from("profiles")
          .update({
            business_name: next.businessName,
            owner_name: next.ownerName,
            email: next.email,
            address: next.address,
          })
          .eq("user_id", user.id);
        if (!error) setProfile(next);
        return { error: error?.message ?? null };
      },
    }),
    [user, profile, loading, needsEmailConfirmation, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
