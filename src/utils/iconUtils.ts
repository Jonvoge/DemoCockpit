import * as LucideIcons from 'lucide-react'

export function getLucideIcon(iconSlug: string): React.ComponentType<{ size?: number; strokeWidth?: number }> {
  const pascalCase = iconSlug
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  return (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>>)[pascalCase] ?? LucideIcons.Zap
}
