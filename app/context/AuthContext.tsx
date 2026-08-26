// This file is the temporary, frontend-only authentication system.
// Later, replace its localStorage code with Supabase authentication calls.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { BusinessProfile } from '../types'

interface AuthState {
  isAuthenticated: boolean
  email: string | null
  profile: BusinessProfile
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, _password: string) => Promise<void>
  signUp: (email: string, _password: string, businessName: string) => Promise<void>
  signOut: () => void
  updateProfile: (profile: BusinessProfile) => void
}

// A stable browser-storage name. Changing it would make existing demo sessions disappear.
const STORAGE_KEY = 'tally.auth.v1'

const defaultProfile: BusinessProfile = {
  businessName: 'Your Business',
  ownerName: '',
  email: '',
  address: '',
}

// The context starts as null so `useAuth` can detect usage outside AuthProvider.
const AuthContext = createContext<AuthContextValue | null>(null)

// Load the latest saved login state when the browser opens the app.
// If no state exists, or old data cannot be read, start as logged out.
function loadState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { isAuthenticated: false, email: null, profile: defaultProfile }
    const parsed = JSON.parse(raw)
    return {
      isAuthenticated: !!parsed.isAuthenticated,
      email: parsed.email ?? null,
      profile: { ...defaultProfile, ...parsed.profile },
    }
  } catch {
    return { isAuthenticated: false, email: null, profile: defaultProfile }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // React state is the single source of truth while the app is open.
  const [state, setState] = useState<AuthState>(loadState)

  // Whenever the login/profile state changes, save it so refreshes keep the demo session.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      // NOTE: this is a frontend-only mock. Swap this for real Supabase auth
      // (supabase.auth.signInWithPassword / signUp) when the backend lands —
      // see BACKEND_TASKS.md, task 1.
      // Demo sign-in: waits briefly to feel like a network request, then marks the user signed in.
      signIn: async (email) => {
        await new Promise((r) => setTimeout(r, 350))
        setState((s) => ({
          ...s,
          isAuthenticated: true,
          email,
          profile: { ...s.profile, email: s.profile.email || email },
        }))
      },
      // Demo sign-up: saves the supplied email and business name locally. No real account is created.
      signUp: async (email, _password, businessName) => {
        await new Promise((r) => setTimeout(r, 350))
        setState((s) => ({
          isAuthenticated: true,
          email,
          profile: { ...s.profile, email, businessName: businessName || s.profile.businessName },
        }))
      },
      // Keep the saved profile but remove access to protected dashboard pages.
      signOut: () => setState((s) => ({ ...s, isAuthenticated: false })),
      // Settings uses this to replace the saved business details.
      updateProfile: (profile) => setState((s) => ({ ...s, profile })),
    }),
    [state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  // A small helper so pages can read auth data without importing AuthContext directly.
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
