import { useState, useEffect } from 'react'
import type { AuthUser } from '../types'

interface SWAAuthResponse {
  clientPrincipal: AuthUser | null
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/.auth/me')
      .then(r => r.json() as Promise<SWAAuthResponse>)
      .then(data => setUser(data.clientPrincipal))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
