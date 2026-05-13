import { describe, it, expect } from 'vitest'
import { incrementClick } from '../src/demos/clickDemo'
import type { Demo } from '../../src/types'

const demo: Demo = {
  id: '1', title: 'T', description: '', url: '', category: '', icon: '',
  visibility: 'public', owner: { id: 'u1', name: '', email: '' },
  clickCount: 5, notes: '', createdAt: '', updatedAt: ''
}

describe('incrementClick', () => {
  it('increments clickCount by 1', () => {
    const updated = incrementClick(demo)
    expect(updated.clickCount).toBe(6)
  })

  it('does not mutate the original', () => {
    incrementClick(demo)
    expect(demo.clickCount).toBe(5)
  })
})
