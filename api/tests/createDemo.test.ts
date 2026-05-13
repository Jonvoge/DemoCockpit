import { describe, it, expect, vi } from 'vitest'
import type { Demo, AuthUser } from '../../src/types'

vi.mock('../src/blobClient', () => ({
  readBlob: vi.fn(async () => ({ data: [], etag: '"abc"' })),
  writeBlob: vi.fn(async () => {}),
}))

vi.mock('../src/auth', () => ({
  getUser: vi.fn(() => ({ userId: 'u1', userDetails: 'Jon', userRoles: ['authenticated'], claims: [{ typ: 'preferred_username', val: 'jon@inspari.dk' }] })),
  getUserEmail: vi.fn(() => 'jon@inspari.dk'),
}))

import { buildDemo } from '../src/demos/createDemo'

describe('buildDemo', () => {
  it('sets owner from user context', () => {
    const user: AuthUser = { userId: 'u1', userDetails: 'Jon', userRoles: ['authenticated'], claims: [{ typ: 'preferred_username', val: 'jon@inspari.dk' }] }
    const input = { title: 'Test', description: 'desc', url: 'https://x.com', category: 'Fabric', icon: 'zap', visibility: 'public' as const, notes: '' }
    const demo = buildDemo(input, user, 'jon@inspari.dk')
    expect(demo.owner.id).toBe('u1')
    expect(demo.owner.email).toBe('jon@inspari.dk')
    expect(demo.clickCount).toBe(0)
    expect(demo.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('sets createdAt and updatedAt to same value', () => {
    const user: AuthUser = { userId: 'u1', userDetails: 'Jon', userRoles: ['authenticated'], claims: [] }
    const input = { title: 'T', description: 'd', url: 'https://x.com', category: 'Fabric', icon: 'zap', visibility: 'public' as const, notes: '' }
    const demo = buildDemo(input, user, 'jon@inspari.dk')
    expect(demo.createdAt).toBe(demo.updatedAt)
  })
})
