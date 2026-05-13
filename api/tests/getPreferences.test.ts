import { describe, it, expect } from 'vitest'
import { defaultPreferences } from '../src/preferences/getPreferences'

describe('defaultPreferences', () => {
  it('returns sensible defaults for a user', () => {
    const prefs = defaultPreferences('user1')
    expect(prefs.userId).toBe('user1')
    expect(prefs.pinnedDemoIds).toEqual([])
    expect(prefs.sortField).toBe('alphabetical')
    expect(prefs.sortDirection).toBe('asc')
    expect(prefs.lastClicked).toEqual({})
  })
})
