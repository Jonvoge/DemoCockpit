import { useState } from 'react'
import { X } from 'lucide-react'
import { IconPicker } from './IconPicker'
import type { Demo } from '../types'

type DemoFormData = Omit<Demo, 'id' | 'owner' | 'clickCount' | 'createdAt' | 'updatedAt'>

interface Props {
  demo: Demo
  onSubmit: (updates: Partial<Demo>) => Promise<void>
  onDelete: () => Promise<void>
  onClose: () => void
}

const inputCls = 'px-3 py-2 rounded-lg border border-[#d5d5d0] text-[0.85rem] focus:outline-none focus:ring-1 focus:ring-[#00A4BD] w-full'

export function EditDemoModal({ demo, onSubmit, onDelete, onClose }: Props) {
  const [form, setForm] = useState<DemoFormData>({
    title: demo.title,
    description: demo.description,
    url: demo.url,
    category: demo.category,
    icon: demo.icon,
    visibility: demo.visibility,
    notes: demo.notes,
  })
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const set = (field: keyof DemoFormData, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl z-50 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[1rem] font-semibold text-[#003C43]">Edit Demo</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#ECECEC] text-[#a0a09a]"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[0.78rem] font-semibold text-[#454545]">Title *</label>
            <input required className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.78rem] font-semibold text-[#454545]">Description</label>
            <textarea rows={2} className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.78rem] font-semibold text-[#454545]">URL *</label>
            <input required type="url" className={inputCls} value={form.url} onChange={e => set('url', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.78rem] font-semibold text-[#454545]">Category *</label>
            <input required className={inputCls} value={form.category} onChange={e => set('category', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.78rem] font-semibold text-[#454545]">Icon</label>
            <IconPicker value={form.icon} onChange={v => set('icon', v)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.78rem] font-semibold text-[#454545]">Visibility</label>
            <div className="flex gap-3">
              {(['public', 'private'] as const).map(v => (
                <label key={v} className="flex items-center gap-1.5 text-[0.85rem] cursor-pointer">
                  <input type="radio" name="edit-visibility" value={v} checked={form.visibility === v} onChange={() => set('visibility', v)} />
                  {v === 'public' ? 'Everyone' : 'Only me'}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.78rem] font-semibold text-[#454545]">Notes & Instructions (Markdown)</label>
            <textarea rows={4} className={inputCls} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-[#00A4BD] text-white font-semibold text-[0.88rem] disabled:opacity-50 hover:bg-[#008392]">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#d5d5d0] text-[#454545] text-[0.88rem] hover:bg-[#ECECEC]">
              Cancel
            </button>
          </div>
        </form>
        <div className="mt-4 pt-4 border-t border-[#e0e0db]">
          {!confirming
            ? <button type="button" onClick={() => setConfirming(true)} className="text-[0.8rem] text-red-500 hover:underline">Delete demo</button>
            : <div className="flex items-center gap-3">
                <span className="text-[0.8rem] text-[#454545]">Are you sure?</span>
                <button type="button" onClick={onDelete} className="text-[0.8rem] text-red-600 font-semibold hover:underline">Yes, delete</button>
                <button type="button" onClick={() => setConfirming(false)} className="text-[0.8rem] text-[#a0a09a] hover:underline">Cancel</button>
              </div>
          }
        </div>
      </div>
    </>
  )
}
