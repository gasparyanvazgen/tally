import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect visitors who are not signed in after the browser has checked their session.
  useEffect(() => {
    if (!isAuthenticated) router.replace('/login')
  }, [isAuthenticated, router])

  // Do not briefly show private dashboard content while the redirect is happening.
  if (!isAuthenticated) return null
  return <>{children}</>
}
