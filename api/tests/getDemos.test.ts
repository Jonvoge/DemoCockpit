import { describe, it, expect, vi } from 'vitest'
import type { Demo } from '../../src/types'

const mockDemos: Demo[] = [
  {
    id: '1', title: 'Public Demo', description: 'desc', url: 'https://a.com',
    category: 'Fabric', icon: 'zap', visibility: 'public',
    owner: { id: 'user1', name: 'Alice', email: 'alice@inspari.dk' },
    clickCount: 5, notes: '', unavailable: false, createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z'
  },
  {
    id: '2', title: 'Private Demo', description: 'desc', url: 'https://b.com',
    category: 'Power BI', icon: 'bar-chart-2', visibility: 'private',
    owner: { id: 'user2', name: 'Bob', email: 'bob@inspari.dk' },
    clickCount: 2, notes: '', unavailable: false, createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z'
  },
]

vi.mock('../src/blobClient', () => ({
  readBlob: vi.fn(async () => ({ data: mockDemos, etag: '"abc"' })),
  writeBlob: vi.fn(async () => {}),
}))

vi.mock('../src/auth', () => ({
  getUser: vi.fn(() => ({ userId: 'user1', userDetails: 'Alice', userRoles: ['authenticated'], claims: [] })),
  getUserEmail: vi.fn(() => 'alice@inspari.dk'),
}))

import { filterDemosForUser } from '../src/demos/getDemos'

describe('filterDemosForUser', () => {
  it('returns public demos for any user', () => {
    const result = filterDemosForUser(mockDemos, 'user1')
    expect(result.find(d => d.id === '1')).toBeDefined()
  })

  it('returns own private demos', () => {
    const result = filterDemosForUser(mockDemos, 'user2')
    expect(result.find(d => d.id === '2')).toBeDefined()
  })

  it('hides other users private demos', () => {
    const result = filterDemosForUser(mockDemos, 'user1')
    expect(result.find(d => d.id === '2')).toBeUndefined()
  })
})
