"use client"

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  // Wait for the initial Supabase session check before deciding whether to
  // redirect — otherwise a logged-in user gets bounced to /login on every
  // refresh, since isAuthenticated starts false until getSession() resolves.
  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [loading, isAuthenticated, router])

  // Do not briefly show private dashboard content while the session check
  // or the redirect is happening.
  if (loading || !isAuthenticated) return null
  return <>{children}</>
}
