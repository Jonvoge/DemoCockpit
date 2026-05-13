import * as LucideIcons from 'lucide-react'

const GENERAL_ICONS = [
  'BarChart2','PieChart','TrendingUp','Database','Table','LineChart','Activity',
  'Brain','Bot','Sparkles','MessageSquare','Lightbulb',
  'Cloud','Server','Globe','Network','Layers',
  'Monitor','Smartphone','Layout','ExternalLink',
  'Users','Building','Briefcase','Target','Rocket',
  'Zap','Shield','Code','Settings','Wrench','Search','Star','Tag','Link',
  'FileText','Play','Map','Compass','Clock','Eye','Package'
]

interface Props {
  value: string
  onChange: (icon: string) => void
}

function toSlug(pascalName: string): string {
  return pascalName.replace(/([A-Z])/g, (_m, l, i) => (i > 0 ? '-' : '') + l.toLowerCase())
}

export function IconPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto p-1 border border-[#e0e0db] rounded-lg bg-[#f5f5f3]">
      {GENERAL_ICONS.map(name => {
        const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>>)[name]
        if (!Icon) return null
        const slug = toSlug(name)
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(slug)}
            className={`p-2 rounded-md flex items-center justify-center transition-colors ${
              value === slug ? 'bg-[#00A4BD] text-white' : 'hover:bg-[#CCEFF3] text-[#454545]'
            }`}
            title={name}
          >
            <Icon size={16} strokeWidth={1.75} />
          </button>
        )
      })}
    </div>
  )
}
