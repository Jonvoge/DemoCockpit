import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { api } from './api'
import { TopBar } from './components/TopBar'
import { FilterBar } from './components/FilterBar'
import { DemoGrid } from './components/DemoGrid'
import { DetailDrawer } from './components/DetailDrawer'
import { AddDemoModal } from './components/AddDemoModal'
import { EditDemoModal } from './components/EditDemoModal'
import { sortDemos } from './utils/demoUtils'
import type { Demo, UserPreferences, SortField, SortDirection } from './types'

export default function App() {
  const { user, loading } = useAuth()
  const [demos, setDemos] = useState<Demo[]>([])
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showPrivate, setShowPrivate] = useState(false)
  const [drawerDemo, setDrawerDemo] = useState<Demo | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editDemo, setEditDemo] = useState<Demo | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([api.demos.list(), api.preferences.get()])
      .then(([d, p]) => {
        setDemos(d)
        setPrefs(p)
      })
      .catch(err => setApiError(String(err)))
  }, [user])

  const categories = useMemo(() => [...new Set(demos.map(d => d.category))].sort(), [demos])

  const filtered = useMemo(() => {
    if (!prefs) return []
    let result = demos
    if (showPrivate) result = result.filter(d => d.owner.id === user?.userId)
    if (activeCategory !== 'All') result = result.filter(d => d.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      )
    }
    return sortDemos(result, prefs.sortField, prefs.sortDirection, prefs.lastClicked)
  }, [demos, prefs, search, activeCategory, showPrivate, user])

  const pinnedDemos = useMemo(
    () => filtered.filter(d => prefs?.pinnedDemoIds.includes(d.id)),
    [filtered, prefs]
  )
  const otherDemos = useMemo(
    () => filtered.filter(d => !prefs?.pinnedDemoIds.includes(d.id)),
    [filtered, prefs]
  )

  const handlePin = useCallback(async (id: string) => {
    if (!prefs) return
    const pinned = prefs.pinnedDemoIds.includes(id)
      ? prefs.pinnedDemoIds.filter(p => p !== id)
      : [...prefs.pinnedDemoIds, id]
    const updated = await api.preferences.update({ pinnedDemoIds: pinned })
    setPrefs(updated)
  }, [prefs])

  const handleCopy = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
  }, [])

  const handleDemoClick = useCallback(async (demo: Demo) => {
    window.open(demo.url, '_blank', 'noreferrer')
    api.demos.click(demo.id).catch(() => {})
    setDemos(prev => prev.map(d => d.id === demo.id ? { ...d, clickCount: d.clickCount + 1 } : d))
    if (prefs) {
      setPrefs(p => p ? { ...p, lastClicked: { ...p.lastClicked, [demo.id]: new Date().toISOString() } } : p)
    }
  }, [prefs])

  const handleSortField = useCallback(async (field: SortField) => {
    if (!prefs) return
    const updated = await api.preferences.update({ sortField: field })
    setPrefs(updated)
  }, [prefs])

  const handleSortDirection = useCallback(async () => {
    if (!prefs) return
    const dir: SortDirection = prefs.sortDirection === 'asc' ? 'desc' : 'asc'
    const updated = await api.preferences.update({ sortDirection: dir })
    setPrefs(updated)
  }, [prefs])

  const handleAddDemo = useCallback(async (data: Omit<Demo, 'id' | 'owner' | 'clickCount' | 'createdAt' | 'updatedAt'>) => {
    const created = await api.demos.create(data)
    setDemos(prev => [...prev, created])
    setShowAdd(false)
  }, [])

  const handleEditDemo = useCallback(async (updates: Partial<Demo>) => {
    if (!editDemo) return
    const updated = await api.demos.update(editDemo.id, updates)
    setDemos(prev => prev.map(d => d.id === editDemo.id ? updated : d))
    setEditDemo(null)
  }, [editDemo])

  const handleDeleteDemo = useCallback(async () => {
    if (!editDemo) return
    await api.demos.delete(editDemo.id)
    setDemos(prev => prev.filter(d => d.id !== editDemo.id))
    setEditDemo(null)
  }, [editDemo])

  if (loading) return (
    <div className="h-screen flex items-center justify-center text-[#a0a09a]">Loading…</div>
  )
  if (!user) return (
    <div className="h-screen flex items-center justify-center text-[#a0a09a]">Redirecting to login…</div>
  )
  if (apiError) return (
    <div className="h-screen flex items-center justify-center flex-col gap-3">
      <div className="text-red-500 font-semibold">API error</div>
      <div className="text-[0.8rem] text-[#454545] max-w-md text-center">{apiError}</div>
    </div>
  )
  if (!prefs) return (
    <div className="h-screen flex items-center justify-center text-[#a0a09a]">Loading…</div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f3] py-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-[#e0e0db]">
        <TopBar user={user} search={search} onSearch={setSearch} />
        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          showPrivate={showPrivate}
          onPrivate={() => setShowPrivate(v => !v)}
          sortField={prefs.sortField}
          sortDirection={prefs.sortDirection}
          onSortField={handleSortField}
          onSortDirection={handleSortDirection}
        />
        <DemoGrid
          pinnedDemos={pinnedDemos}
          otherDemos={otherDemos}
          currentUser={user}
          onPin={handlePin}
          onCopy={handleCopy}
          onInfo={setDrawerDemo}
          onClick={handleDemoClick}
        />
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#00A4BD] text-white shadow-lg flex items-center justify-center hover:bg-[#008392] transition-colors hover:scale-105"
        title="Add demo"
      >
        <Plus size={24} />
      </button>

      <DetailDrawer
        demo={drawerDemo}
        onClose={() => setDrawerDemo(null)}
        onOpen={handleDemoClick}
        onCopy={handleCopy}
      />

      {showAdd && <AddDemoModal onSubmit={handleAddDemo} onClose={() => setShowAdd(false)} />}
      {editDemo && (
        <EditDemoModal
          demo={editDemo}
          onSubmit={handleEditDemo}
          onDelete={handleDeleteDemo}
          onClose={() => setEditDemo(null)}
        />
      )}
    </div>
  )
}
