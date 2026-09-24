import { ArrowUpDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SortOption } from '@/types/note'

const SORT_OPTIONS: SortOption[] = ['Mới nhất', 'Cũ nhất', 'Theo tên (A-Z)']

interface SortDropdownProps {
  sortOption: SortOption
  onSortChange: (option: SortOption) => void
}

export function SortDropdown({ sortOption, onSortChange }: SortDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 bg-muted/60 hover:bg-muted text-foreground text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shadow-xs border-border"
          >
            <ArrowUpDown className="size-3.5 text-muted-foreground" />
            <span>{sortOption}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44 bg-card text-card-foreground">
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => onSortChange(option)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{option}</span>
            {sortOption === option && (
              <Check className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
