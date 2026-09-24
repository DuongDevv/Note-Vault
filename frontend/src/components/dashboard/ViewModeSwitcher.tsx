import { LayoutGrid, List as ListIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ViewMode } from '@/types/note'

interface ViewModeSwitcherProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function ViewModeSwitcher({
  viewMode,
  onViewModeChange,
}: ViewModeSwitcherProps) {
  return (
    <div className="h-9 p-0.5 bg-muted/60 rounded-lg flex items-center shadow-xs border border-border">
      <Button
        type="button"
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('grid')}
        title="Chế độ xem lưới"
        className={`size-8 rounded-md transition-all ${
          viewMode === 'grid' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
        }`}
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        type="button"
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('list')}
        title="Chế độ xem danh sách"
        className={`size-8 rounded-md transition-all ${
          viewMode === 'list' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
        }`}
      >
        <ListIcon className="size-4" />
      </Button>
    </div>
  )
}
