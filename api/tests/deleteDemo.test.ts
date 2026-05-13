import { describe, it, expect } from 'vitest'
import { removeDemoById } from '../src/demos/deleteDemo'
import type { Demo } from '../../src/types'

const demos: Demo[] = [
  { id: '1', title: 'A', description: '', url: '', category: '', icon: '', visibility: 'public', owner: { id: 'u1', name: '', email: '' }, clickCount: 0, notes: '', createdAt: '', updatedAt: '' },
  { id: '2', title: 'B', description: '', url: '', category: '', icon: '', visibility: 'public', owner: { id: 'u2', name: '', email: '' }, clickCount: 0, notes: '', createdAt: '', updatedAt: '' },
]

describe('removeDemoById', () => {
  it('removes the matching demo', () => {
    const result = removeDemoById(demos, '1')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('2')
  })

  it('returns same array if id not found', () => {
    const result = removeDemoById(demos, 'nonexistent')
    expect(result.length).toBe(2)
  })
})
