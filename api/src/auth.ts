import type { AuthUser } from '../../src/types.js'

export function getUser(header: string | undefined): AuthUser | null {
  if (!header) return null
  try {
    const decoded = Buffer.from(header, 'base64').toString('utf8')
    return JSON.parse(decoded) as AuthUser
  } catch {
    return null
  }
}

export function getUserEmail(user: AuthUser): string {
  const emailClaim = user.claims.find(
    c => c.typ === 'preferred_username' ||
         c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
  )
  return emailClaim?.val ?? user.userDetails
}
