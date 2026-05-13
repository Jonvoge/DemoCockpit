import { useState } from 'react'
import { X } from 'lucide-react'
import { IconPicker } from './IconPicker'
import type { Demo } from '../types'

type DemoFormData = Omit<Demo, 'id' | 'owner' | 'clickCount' | 'createdAt' | 'updatedAt'>

interface Props {
  onSubmit: (data: DemoFormData) => Promise<void>
  onClose: () => void
}

const EMPTY: DemoFormData = {
  title: '', description: '', url: '', category: '', icon: 'zap', visibility: 'public', notes: ''
}

const inputCls = 'px-3 py-2 rounded-lg border border-[#d5d5d0] text-[0.85rem] focus:outline-none focus:ring-1 focus:ring-[#00A4BD] w-full'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[0.78rem] font-semibold text-[#454545]">{label}</label>
      {children}
    </div>
  )
}

export function AddDemoModal({ onSubmit, onClose }: Props) {
  const [form, setForm] = useState<DemoFormData>(EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (field: keyof DemoFormData, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const valid = form.title.trim() && form.url.trim() && form.category.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
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
          <h2 className="text-[1rem] font-semibold text-[#003C43]">Add Demo</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#ECECEC] text-[#a0a09a]">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Title *">
            <input required className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} />
          </Field>
          <Field label="Description">
            <textarea rows={2} className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} />
          </Field>
          <Field label="URL *">
            <input required type="url" className={inputCls} value={form.url} onChange={e => set('url', e.target.value)} />
          </Field>
          <Field label="Category *">
            <input required className={inputCls} placeholder="e.g. Fabric, Power BI, Website" value={form.category} onChange={e => set('category', e.target.value)} />
          </Field>
          <Field label="Icon">
            <IconPicker value={form.icon} onChange={v => set('icon', v)} />
          </Field>
          <Field label="Visibility">
            <div className="flex gap-3">
              {(['public', 'private'] as const).map(v => (
                <label key={v} className="flex items-center gap-1.5 text-[0.85rem] cursor-pointer">
                  <input type="radio" name="visibility" value={v} checked={form.visibility === v} onChange={() => set('visibility', v)} />
                  {v === 'public' ? 'Everyone' : 'Only me'}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Notes & Instructions (Markdown)">
            <textarea
              rows={4}
              className={inputCls}
              placeholder="Access requirements, demo tips, walkthrough notes..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </Field>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!valid || saving}
              className="flex-1 py-2 rounded-lg bg-[#00A4BD] text-white font-semibold text-[0.88rem] disabled:opacity-50 hover:bg-[#008392]"
            >
              {saving ? 'Saving…' : 'Add Demo'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#d5d5d0] text-[#454545] text-[0.88rem] hover:bg-[#ECECEC]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
