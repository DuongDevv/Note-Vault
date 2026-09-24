import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface NoteTagBadgeProps {
  tag: string
  isLocked?: boolean
}

export function NoteTagBadge({ tag, isLocked }: NoteTagBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Badge
        variant="secondary"
        className="px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide bg-secondary text-secondary-foreground border border-border"
      >
        {tag}
      </Badge>
      {isLocked && (
        <Badge
          variant="outline"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border-primary/20 text-xs font-medium"
        >
          <Lock className="size-3" />
          <span>Mã hóa</span>
        </Badge>
      )}
    </div>
  )
}
