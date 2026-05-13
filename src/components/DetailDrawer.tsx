import { useEffect } from 'react'
import { X, ExternalLink, Copy, MessageSquare } from 'lucide-react'
import { getLucideIcon } from '../utils/iconUtils'
import { marked } from 'marked'
import type { Demo } from '../types'

interface Props {
  demo: Demo | null
  onClose: () => void
  onOpen: (demo: Demo) => void
  onCopy: (url: string) => void
}

export function DetailDrawer({ demo, onClose, onOpen, onCopy }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!demo) return null

  const IconComponent = getLucideIcon(demo.icon)
  const teamsUrl = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(demo.owner.email)}`
  const ownerInitials = demo.owner.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const notesHtml = demo.notes ? marked.parse(demo.notes) as string : ''

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 w-[420px] h-full bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#e0e0db]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#CCEFF3] text-[#005862] flex-shrink-0">
            <IconComponent size={22} strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[#003C43]">{demo.title}</div>
            <span className="inline-flex items-center text-[0.7rem] font-medium px-2 py-0.5 rounded-full bg-[#CCEFF3] text-[#005862] mt-1">
              {demo.category}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#ECECEC] text-[#a0a09a]">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          <div>
            <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-[#a0a09a] mb-2">Description</div>
            <p className="text-[0.88rem] text-[#454545] leading-relaxed">{demo.description}</p>
          </div>

          {demo.notes && (
            <div>
              <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-[#a0a09a] mb-2">Notes &amp; Instructions</div>
              <div
                className="text-[0.85rem] text-[#454545] leading-relaxed bg-[#f5f5f3] rounded-lg p-4 border border-[#e0e0db]"
                dangerouslySetInnerHTML={{ __html: notesHtml }}
              />
            </div>
          )}

          <div>
            <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-[#a0a09a] mb-2">Owner</div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#00A4BD] text-white flex items-center justify-center text-[0.7rem] font-semibold flex-shrink-0">
                {ownerInitials}
              </div>
              <span className="text-[0.88rem] font-medium text-[#003C43]">{demo.owner.name}</span>
              <a
                href={teamsUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#d5d5d0] text-[0.78rem] text-[#454545] hover:bg-[#ECECEC]"
              >
                <MessageSquare size={13} /> Chat in Teams
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e0e0db] flex gap-3">
          <button
            onClick={() => onOpen(demo)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#00A4BD] text-white font-semibold text-[0.88rem] hover:bg-[#008392] transition-colors"
          >
            <ExternalLink size={15} /> Open Demo
          </button>
          <button
            onClick={() => onCopy(demo.url)}
            className="px-4 py-2 rounded-lg border border-[#d5d5d0] text-[#454545] text-[0.88rem] hover:bg-[#ECECEC] transition-colors"
          >
            <Copy size={15} />
          </button>
        </div>
      </div>
    </>
  )
}
