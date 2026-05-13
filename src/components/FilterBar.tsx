import { ChevronUp, ChevronDown } from 'lucide-react'
import type { SortField, SortDirection } from '../types'

interface Props {
  categories: string[]
  activeCategory: string
  onCategory: (cat: string) => void
  showPrivate: boolean
  onPrivate: () => void
  showUnavailable: boolean
  onUnavailable: () => void
  sortField: SortField
  sortDirection: SortDirection
  onSortField: (f: SortField) => void
  onSortDirection: () => void
}

export function FilterBar({
  categories, activeCategory, onCategory,
  showPrivate, onPrivate,
  showUnavailable, onUnavailable,
  sortField, sortDirection, onSortField, onSortDirection
}: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex gap-2 flex-wrap">
        {['All', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => onCategory(cat)}
            className={`px-3 py-1 rounded-full text-[0.78rem] font-medium border transition-colors ${
              activeCategory === cat
                ? 'bg-[#00A4BD] text-white border-[#00A4BD]'
                : 'bg-white text-[#454545] border-[#d5d5d0] hover:border-[#00A4BD]'
            }`}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={onPrivate}
          className={`px-3 py-1 rounded-full text-[0.78rem] font-medium border border-dashed transition-colors ${
            showPrivate
              ? 'bg-[#00A4BD] text-white border-[#00A4BD]'
              : 'bg-white text-[#454545] border-[#d5d5d0] hover:border-[#00A4BD]'
          }`}
        >
          Private
        </button>
        <button
          onClick={onUnavailable}
          className={`px-3 py-1 rounded-full text-[0.78rem] font-medium border border-dashed transition-colors ${
            showUnavailable
              ? 'bg-[#e5900a] text-white border-[#e5900a]'
              : 'bg-white text-[#454545] border-[#d5d5d0] hover:border-[#e5900a]'
          }`}
        >
          Unavailable
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <select
          value={sortField}
          onChange={e => onSortField(e.target.value as SortField)}
          className="px-2 py-1 rounded-md border border-[#d5d5d0] bg-white text-[#454545] text-[0.78rem] font-[inherit] focus:outline-none"
        >
          <option value="alphabetical">A → Z</option>
          <option value="clickCount">Most clicked</option>
          <option value="lastUsed">Last used</option>
        </select>
        <button
          onClick={onSortDirection}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-[#d5d5d0] bg-white hover:bg-[#ECECEC]"
        >
          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
    </div>
  )
}
