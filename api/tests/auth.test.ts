import { describe, it, expect } from 'vitest'
import { getUser, getUserEmail } from '../src/auth'

describe('getUser', () => {
  it('returns null when header is missing', () => {
    expect(getUser(undefined)).toBeNull()
  })

  it('decodes a valid x-ms-client-principal header', () => {
    const payload = {
      userId: 'abc123',
      userDetails: 'Jon Vöge',
      userRoles: ['authenticated'],
      claims: [{ typ: 'preferred_username', val: 'jon@inspari.dk' }]
    }
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
    const user = getUser(encoded)
    expect(user).not.toBeNull()
    expect(user!.userId).toBe('abc123')
    expect(user!.userDetails).toBe('Jon Vöge')
    expect(user!.claims[0].val).toBe('jon@inspari.dk')
  })

  it('returns null when header is malformed base64', () => {
    expect(getUser('!!!not-base64!!!')).toBeNull()
  })
})

describe('getUserEmail', () => {
  it('returns preferred_username claim', () => {
    const user = {
      userId: 'u1', userDetails: 'Jon', userRoles: ['authenticated'],
      claims: [{ typ: 'preferred_username', val: 'jon@inspari.dk' }]
    }
    expect(getUserEmail(user)).toBe('jon@inspari.dk')
  })

  it('falls back to userDetails when no email claim', () => {
    const user = {
      userId: 'u1', userDetails: 'Jon Vöge', userRoles: ['authenticated'],
      claims: []
    }
    expect(getUserEmail(user)).toBe('Jon Vöge')
  })
})
