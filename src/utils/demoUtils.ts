import type { Demo, SortField, SortDirection } from '../types'

export function isNewDemo(createdAt: string): boolean {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return new Date(createdAt) > sevenDaysAgo
}

export function sortDemos(
  demos: Demo[],
  sortField: SortField,
  sortDirection: SortDirection,
  lastClicked: Record<string, string>
): Demo[] {
  return [...demos].sort((a, b) => {
    let cmp = 0
    if (sortField === 'alphabetical') cmp = a.title.localeCompare(b.title)
    else if (sortField === 'clickCount') cmp = b.clickCount - a.clickCount
    else if (sortField === 'lastUsed') {
      const aTime = lastClicked[a.id] ?? '0'
      const bTime = lastClicked[b.id] ?? '0'
      cmp = bTime.localeCompare(aTime)
    }
    return sortDirection === 'asc' ? cmp : -cmp
  })
}
