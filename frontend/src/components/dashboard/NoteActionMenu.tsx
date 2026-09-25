import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteActionMenuProps {
  noteId: string;
  isLocked: boolean;
  className?: string;
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string) => void;
}

export function NoteActionMenu({
  noteId,
  isLocked,
  className = "",
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
            className={`text-muted-foreground hover:text-foreground size-7 rounded-lg ${className}`}
            aria-label="Tùy chọn ghi chú"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="bg-card text-card-foreground w-40"
      >
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onToggleLock?.(noteId)}
        >
          {isLocked ? "Mở khóa PIN" : "Khóa bằng PIN"}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={() => onDelete?.(noteId)}
        >
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
