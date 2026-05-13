import { Pin, Copy, MessageSquare, Info, Lock } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { Demo, AuthUser } from '../types'
import { isNewDemo } from '../utils/demoUtils'

interface Props {
  demo: Demo
  isPinned: boolean
  currentUser: AuthUser
  onPin: (id: string) => void
  onCopy: (url: string) => void
  onInfo: (demo: Demo) => void
  onClick: (demo: Demo) => void
}

function getLucideIcon(iconSlug: string): React.ComponentType<{ size?: number; strokeWidth?: number }> {
  const pascalCase = iconSlug
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  return (LucideIcons as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>>)[pascalCase] ?? LucideIcons.Zap
}

export function DemoCard({ demo, isPinned, currentUser, onPin, onCopy, onInfo, onClick }: Props) {
  const IconComponent = getLucideIcon(demo.icon)
  const teamsUrl = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(demo.owner.email)}`
  const isNew = isNewDemo(demo.createdAt)

  return (
    <div
      className={`group relative bg-white border rounded-xl p-5 cursor-pointer transition-all hover:border-[#00A4BD] hover:shadow-md hover:-translate-y-0.5 ${isPinned ? 'border-l-4 border-l-[#00A4BD] border-[#e0e0db]' : 'border-[#e0e0db]'}`}
      onClick={() => onClick(demo)}
    >
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#CCEFF3] text-[#005862]">
          <IconComponent size={22} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[0.95rem] text-[#003C43]">{demo.title}</span>
            {isNew && (
              <span className="text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#00A4BD] text-white">New</span>
            )}
            {demo.visibility === 'private' && (
              <span className="flex items-center gap-1 text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full bg-[#ECECEC] text-[#454545] border border-[#d5d5d0]">
                <Lock size={10} />Private
              </span>
            )}
          </div>
          <p className="text-[0.8rem] text-[#454545] leading-snug">{demo.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center text-[0.7rem] font-medium px-2 py-0.5 rounded-full bg-[#CCEFF3] text-[#005862]">
              {demo.category}
            </span>
            <span className="text-[0.7rem] text-[#454545]">· {demo.owner.name}</span>
            <div
              className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => onPin(demo.id)}
                title={isPinned ? 'Unpin' : 'Pin'}
                className="p-1 rounded hover:bg-[#ECECEC]"
              >
                <Pin size={14} />
              </button>
              <button
                onClick={() => onCopy(demo.url)}
                title="Copy URL"
                className="p-1 rounded hover:bg-[#ECECEC]"
              >
                <Copy size={14} />
              </button>
              <a
                href={teamsUrl}
                target="_blank"
                rel="noreferrer"
                title={`Chat with ${demo.owner.name}`}
                className="p-1 rounded hover:bg-[#ECECEC] flex items-center"
              >
                <MessageSquare size={14} />
              </a>
              <button
                onClick={() => onInfo(demo)}
                title="Notes & Instructions"
                className="p-1 rounded hover:bg-[#ECECEC]"
              >
                <Info size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
