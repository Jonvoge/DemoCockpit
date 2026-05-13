import { Search } from 'lucide-react'
import type { AuthUser } from '../types'

interface Props {
  user: AuthUser
  search: string
  onSearch: (q: string) => void
}

export function TopBar({ user, search, onSearch }: Props) {
  const initials = user.userDetails
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#003C43] rounded-t-xl">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00A4BD]" />
        <span className="text-white font-semibold text-[1rem]">Demo Launchpad</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a0a09a]" />
          <input
            type="text"
            placeholder="Search demos..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-[#a0a09a] text-[0.8rem] w-52 focus:outline-none focus:ring-1 focus:ring-[#00A4BD]"
          />
        </div>
        <div className="w-8 h-8 rounded-full bg-[#00A4BD] text-white flex items-center justify-center text-[0.75rem] font-semibold">
          {initials}
        </div>
      </div>
    </div>
  )
}
