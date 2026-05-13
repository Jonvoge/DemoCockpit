import { Pin, Copy, MessageSquare, Info, Lock, ArrowUpRight, Pencil } from 'lucide-react'
import { getLucideIcon } from '../utils/iconUtils'
import type { Demo, AuthUser } from '../types'
import { isNewDemo } from '../utils/demoUtils'

interface Props {
  demo: Demo
  isPinned: boolean
  currentUser: AuthUser
  onEdit: (demo: Demo) => void
  onPin: (id: string) => void
  onCopy: (url: string) => void
  onInfo: (demo: Demo) => void
  onClick: (demo: Demo) => void
}

export function DemoCard({ demo, isPinned, currentUser, onEdit, onPin, onCopy, onInfo, onClick }: Props) {
  const IconComponent = getLucideIcon(demo.icon)
  const teamsUrl = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(demo.owner.email)}`
  const isNew = isNewDemo(demo.createdAt)
  const ownerLabel = demo.owner.id === currentUser.userId ? 'Added by you' : `Added by ${demo.owner.name}`
  const canEdit = demo.owner.id === currentUser.userId || currentUser.userRoles.includes('admin')

  return (
    <div
      className={`group relative flex h-full min-h-[228px] cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white transition-all hover:-translate-y-0.5 hover:border-[#00A4BD] hover:shadow-[0_16px_30px_rgba(0,60,67,0.08)] ${isPinned ? 'border-[#00A4BD] shadow-[inset_0_0_0_1px_rgba(0,164,189,0.16)]' : 'border-[#dce3e4]'}`}
      onClick={() => onClick(demo)}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00A4BD] via-[#5cc6d5] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start gap-4 px-5 pt-5">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#d8f1f5] text-[#005862] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <IconComponent size={24} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {isNew && (
              <span className="rounded-full bg-[#00A4BD] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white">New</span>
            )}
            <span className="inline-flex items-center rounded-full border border-[#c7e9ee] bg-[#eef9fb] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#005862]">
              {demo.category}
            </span>
            {demo.visibility === 'private' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#d5d5d0] bg-[#f4f4f2] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#454545]">
                <Lock size={11} /> Private
              </span>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-[1rem] font-semibold leading-tight text-[#003C43]" title={demo.title}>{demo.title}</h3>
            <p className="line-clamp-3 text-[0.83rem] leading-snug text-[#4f5c5f]" title={demo.description || undefined}>{demo.description || 'No description yet.'}</p>
            <div className="flex items-center gap-3 pt-1 text-[0.72rem] text-[#6a7678]">
              <span className="truncate">{ownerLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[#edf1f1] bg-[#fbfdfd] px-5 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPin(demo.id)}
            title={isPinned ? 'Unpin' : 'Pin'}
            className={`rounded-lg p-2 transition-colors ${isPinned ? 'bg-[#dff4f7] text-[#007f92]' : 'text-[#53686c] hover:bg-[#edf4f5]'}`}
          >
            <Pin size={15} />
          </button>
          <button
            onClick={() => onCopy(demo.url)}
            title="Copy URL"
            className="rounded-lg p-2 text-[#53686c] transition-colors hover:bg-[#edf4f5]"
          >
            <Copy size={15} />
          </button>
          <a
            href={teamsUrl}
            target="_blank"
            rel="noreferrer"
            title={`Chat with ${demo.owner.name}`}
            className="flex items-center rounded-lg p-2 text-[#53686c] transition-colors hover:bg-[#edf4f5]"
          >
            <MessageSquare size={15} />
          </a>
          <button
            onClick={() => onInfo(demo)}
            title="Notes & Instructions"
            className="rounded-lg p-2 text-[#53686c] transition-colors hover:bg-[#edf4f5]"
          >
            <Info size={15} />
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit(demo)}
              title="Edit demo"
              className="rounded-lg p-2 text-[#53686c] transition-colors hover:bg-[#edf4f5]"
            >
              <Pencil size={15} />
            </button>
          )}
        </div>

        <button
          onClick={() => onClick(demo)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#003C43] px-3 py-2 text-[0.78rem] font-semibold text-white transition-colors hover:bg-[#005862]"
        >
          Open
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  )
}
