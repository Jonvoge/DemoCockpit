import { Pin } from 'lucide-react'
import { DemoCard } from './DemoCard'
import type { Demo, AuthUser } from '../types'

interface Props {
  pinnedDemos: Demo[]
  otherDemos: Demo[]
  currentUser: AuthUser
  onPin: (id: string) => void
  onCopy: (url: string) => void
  onInfo: (demo: Demo) => void
  onClick: (demo: Demo) => void
}

export function DemoGrid({ pinnedDemos, otherDemos, currentUser, onPin, onCopy, onInfo, onClick }: Props) {
  return (
    <div className="pb-6">
      {pinnedDemos.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 px-4 mb-3 text-[0.8rem] font-semibold text-[#a0a09a] uppercase tracking-wider">
            <Pin size={12} /> Pinned
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 px-4">
            {pinnedDemos.map(d => (
              <DemoCard key={d.id} demo={d} isPinned={true} currentUser={currentUser} onPin={onPin} onCopy={onCopy} onInfo={onInfo} onClick={onClick} />
            ))}
          </div>
        </div>
      )}
      <div>
        <div className="px-4 mb-3 text-[0.8rem] font-semibold text-[#a0a09a] uppercase tracking-wider">All demos</div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 px-4">
          {otherDemos.map(d => (
            <DemoCard key={d.id} demo={d} isPinned={false} currentUser={currentUser} onPin={onPin} onCopy={onCopy} onInfo={onInfo} onClick={onClick} />
          ))}
        </div>
        {otherDemos.length === 0 && pinnedDemos.length === 0 && (
          <p className="px-4 text-[0.85rem] text-[#a0a09a]">No demos match your filters.</p>
        )}
        {otherDemos.length === 0 && pinnedDemos.length > 0 && null}
      </div>
    </div>
  )
}
