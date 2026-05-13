import { describe, it, expect } from 'vitest'
import { canModify } from '../src/demos/updateDemo'
import type { Demo, AuthUser } from '../../src/types'

const demo: Demo = {
  id: '1', title: 'T', description: 'd', url: 'https://x.com',
  category: 'Fabric', icon: 'zap', visibility: 'public',
  owner: { id: 'owner1', name: 'Alice', email: 'alice@inspari.dk' },
  clickCount: 0, notes: '', createdAt: '', updatedAt: ''
}

describe('canModify', () => {
  it('allows owner to modify', () => {
    const user: AuthUser = { userId: 'owner1', userDetails: 'Alice', userRoles: ['authenticated'], claims: [] }
    expect(canModify(demo, user)).toBe(true)
  })

  it('allows admin to modify', () => {
    const user: AuthUser = { userId: 'other', userDetails: 'Admin', userRoles: ['authenticated', 'admin'], claims: [] }
    expect(canModify(demo, user)).toBe(true)
  })

  it('blocks non-owner non-admin', () => {
    const user: AuthUser = { userId: 'other', userDetails: 'Bob', userRoles: ['authenticated'], claims: [] }
    expect(canModify(demo, user)).toBe(false)
  })
})
