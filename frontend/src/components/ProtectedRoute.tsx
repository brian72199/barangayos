import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { isAuthenticated, verifyAuth, hasRole, type Role } from '@/auth/session'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: Role[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>(
    isAuthenticated() ? 'loading' : 'unauthenticated',
  )

  useEffect(() => {
    if (state !== 'loading') return
    verifyAuth().then((ok) => {
      setState(ok ? 'authenticated' : 'unauthenticated')
    })
  }, [state])

  if (state === 'loading') return null
  if (state === 'unauthenticated') return <Navigate to="/login" replace />
  if (roles && !hasRole(...roles)) return <Navigate to="/" replace />
  return <>{children}</>
}