import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NoteActionMenuProps {
  noteId: string
  isLocked: boolean
  className?: string
  onDelete?: (id: string) => void
  onToggleLock?: (id: string) => void
}

export function NoteActionMenu({
  noteId,
  isLocked,
  className = '',
  onDelete,
  onToggleLock,
}: NoteActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={`size-7 rounded-lg text-muted-foreground hover:text-foreground ${className}`}
            aria-label="Tùy chọn ghi chú"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40 bg-card text-card-foreground">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onToggleLock?.(noteId)}
        >
          {isLocked ? 'Mở khóa' : 'Mã hóa'}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => onDelete?.(noteId)}
        >
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
