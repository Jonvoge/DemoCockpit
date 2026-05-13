import type { Demo, UserPreferences } from './types'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  demos: {
    list: () => apiFetch<Demo[]>('/api/demos'),
    create: (demo: Omit<Demo, 'id' | 'owner' | 'clickCount' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<Demo>('/api/demos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(demo) }),
    update: (id: string, updates: Partial<Demo>) =>
      apiFetch<Demo>(`/api/demos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }),
    delete: (id: string) =>
      apiFetch<void>(`/api/demos/${id}`, { method: 'DELETE' }),
    click: (id: string) =>
      apiFetch<void>(`/api/demos/${id}/click`, { method: 'POST' }),
  },
  preferences: {
    get: () => apiFetch<UserPreferences>('/api/preferences'),
    update: (prefs: Partial<UserPreferences>) =>
      apiFetch<UserPreferences>('/api/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prefs) }),
  },
}
