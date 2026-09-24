import type { Topic } from '@/types/note'
import { Button } from '@/components/ui/button'

interface TopicFilterPillsProps {
  topics: Topic[]
  activeTopicId: string
  totalCount: number
  onSelectTopic: (id: string) => void
  className?: string
}

export function TopicFilterPills({
  topics,
  activeTopicId,
  totalCount,
  onSelectTopic,
  className = '',
}: TopicFilterPillsProps) {
  return (
    <div
      className={`w-full overflow-x-auto no-scrollbar flex items-center gap-2 pb-2 pt-1 scroll-smooth ${className}`}
    >
      <Button
        type="button"
        variant={!activeTopicId ? 'default' : 'secondary'}
        onClick={() => onSelectTopic('')}
        className="shrink-0 h-9 px-4 rounded-full text-xs font-medium shadow-xs transition-transform active:scale-95 cursor-pointer"
      >
        <span>Tất cả</span>
        <span
          className={`ml-1 text-[11px] ${
            !activeTopicId
              ? 'text-primary-foreground/80'
              : 'text-muted-foreground'
          }`}
        >
          ({totalCount})
        </span>
      </Button>

      {topics.map((t) => {
        const isActive = activeTopicId === t.id
        return (
          <Button
            key={t.id}
            type="button"
            variant={isActive ? 'default' : 'secondary'}
            onClick={() => onSelectTopic(t.id)}
            className="shrink-0 h-9 px-3.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            <span>{t.name}</span>
            <span
              className={`ml-1 text-[11px] ${
                isActive
                  ? 'text-primary-foreground/80'
                  : 'text-muted-foreground'
              }`}
            >
              ({t.count})
            </span>
          </Button>
        )
      })}
    </div>
  )
}
