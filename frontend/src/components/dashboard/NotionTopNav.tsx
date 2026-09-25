import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Lock,
  Unlock,
  Trash2,
  MoreHorizontal,
  Folder,
  FileText,
  Clock,
} from "lucide-react";
import type { Note, Topic } from "@/types/note";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotionTopNavProps {
  currentNote?: Note | null;
  currentTopic?: Topic | null;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  onToggleLock?: (noteId: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onNavigateTopic?: (topicId: string) => void;
}

export function NotionTopNav({
  currentNote,
  currentTopic,
  isSaving,
  lastSavedAt,
  onToggleLock,
  onDeleteNote,
  onNavigateTopic,
}: NotionTopNavProps) {
  // Format last edited status string
  const formatLastEdited = () => {
    if (isSaving) return "Đang lưu...";
    if (lastSavedAt) {
      return `Đã lưu ${lastSavedAt.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    if (currentNote?.updatedAt) {
      const date = new Date(currentNote.updatedAt);
      return `Đã sửa ${date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      })}`;
    }
    return "Đã lưu";
  };

  return (
    <header className="border-border/40 bg-background/90 sticky top-0 z-40 flex h-11 w-full items-center justify-between border-b px-3.5 backdrop-blur-md transition-colors select-none">
      {/* Left: Sidebar Trigger & Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1 size-7" />

        {/* Minimalist Breadcrumbs */}
        <div className="flex min-w-0 items-center gap-1.5 text-xs">
          {currentTopic ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTopic?.(currentTopic.id)}
              className="text-muted-foreground hover:text-foreground h-auto cursor-pointer truncate p-0 font-normal hover:bg-transparent"
            >
              <Folder className="size-3.5 opacity-70" />
              <span className="truncate">{currentTopic.name}</span>
            </Button>
          ) : (
            <span className="text-muted-foreground flex items-center gap-1 truncate font-normal">
              <FileText className="size-3.5 opacity-70" />
              <span>Ghi chú</span>
            </span>
          )}

          <span className="text-muted-foreground/40 font-mono text-[11px]">
            /
          </span>

          <span className="text-foreground truncate font-medium">
            {currentNote?.title ?? "Trang chưa có tiêu đề"}
          </span>
        </div>
      </div>

      {/* Right: Actions & Last Edited Status */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Last Edited Status */}
        <span className="text-muted-foreground/70 mr-1 hidden items-center gap-1 font-sans text-[11px] sm:inline-flex">
          <Clock className="size-3 opacity-60" />
          {formatLastEdited()}
        </span>

        {/* PIN Lock Toggle Button */}
        {currentNote && onToggleLock && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onToggleLock(currentNote.id)}
            title={
              currentNote.isLocked
                ? "Mở khóa ghi chú (Bỏ mã hóa PIN)"
                : "Khóa ghi chú bằng mã PIN bảo vệ"
            }
            className="text-muted-foreground hover:text-foreground size-7 rounded-md"
          >
            {currentNote.isLocked ? (
              <Lock className="text-foreground size-3.5" />
            ) : (
              <Unlock className="size-3.5 opacity-60" />
            )}
          </Button>
        )}

        {/* More Actions Menu */}
        {currentNote && onDeleteNote && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground size-7 cursor-pointer"
                />
              }
            >
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 text-xs">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteNote(currentNote.id)}
              >
                <Trash2 className="size-3.5" />
                <span>Xóa trang</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
