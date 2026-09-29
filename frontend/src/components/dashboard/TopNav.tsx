import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Lock,
  Unlock,
  Trash2,
  MoreHorizontal,
  Folder,
  FileText,
  Clock,
  Check,
  ChevronDown,
} from "lucide-react";
import type { Note, Topic } from "@/types/note";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useUIStore } from "@/stores/useUIStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavProps {
  currentNote?: Note | null;
  currentTopic?: Topic | null;
  hasPrivatePin?: boolean;
}

export function TopNav({
  currentNote,
  currentTopic,
  hasPrivatePin,
}: TopNavProps) {
  const isSaving = useWorkspaceStore((s) => s.isSaving);
  const lastSavedAt = useWorkspaceStore((s) => s.lastSavedAt);
  const topics = useWorkspaceStore((s) => s.topics);
  const moveNoteToTopic = useWorkspaceStore((s) => s.moveNoteToTopic);
  const requestLockToggle = useUIStore((s) => s.requestLockToggle);
  const setNoteToDelete = useUIStore((s) => s.setNoteToDelete);
  const formatLastEdited = () => {
    if (!currentNote) return null;
    if (isSaving) return "Đang lưu...";
    if (lastSavedAt) {
      return `Đã lưu ${lastSavedAt.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    if (currentNote.updatedAt) {
      const date = new Date(currentNote.updatedAt);
      return `Đã sửa ${date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      })}`;
    }
    return "Đã lưu";
  };

  return (
    <header className="border-border/40 bg-background/95 sticky top-0 z-40 flex h-11 w-full shrink-0 items-center justify-between border-b px-3.5 backdrop-blur-md transition-colors select-none">
      {/* Left: Sidebar Trigger & Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1 size-7" />

        {/* Minimalist Breadcrumbs */}
        {/* Minimalist Breadcrumbs with Topic Switcher */}
        <div className="flex min-w-0 items-center gap-1.5 text-xs">
          {currentNote ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex h-auto cursor-pointer items-center gap-1.5 truncate rounded-md p-1 font-normal transition-colors"
                    title="Thay đổi chủ đề của trang này"
                  />
                }
              >
                {currentTopic ? (
                  <>
                    <Folder className="size-3.5 shrink-0 opacity-70" />
                    <span className="truncate font-medium">
                      {currentTopic.name}
                    </span>
                  </>
                ) : (
                  <>
                    <FileText className="size-3.5 shrink-0 opacity-70" />
                    <span>Chưa phân loại</span>
                  </>
                )}
                <ChevronDown className="size-3 shrink-0 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 text-xs">
                <div className="text-muted-foreground px-2 py-1 text-[11px] font-medium">
                  Chuyển ghi chú đến chủ đề
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void moveNoteToTopic(currentNote.id, null)}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="text-muted-foreground size-3.5" />
                    <span>Chưa phân loại</span>
                  </span>
                  {!currentNote.topicId && (
                    <Check className="text-primary size-3.5" />
                  )}
                </DropdownMenuItem>
                {topics.length > 0 && <DropdownMenuSeparator />}
                {topics.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => void moveNoteToTopic(currentNote.id, t.id)}
                    className="flex cursor-pointer items-center justify-between"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Folder className="text-muted-foreground size-3.5 shrink-0" />
                      <span className="truncate">{t.name}</span>
                    </span>
                    {currentNote.topicId === t.id && (
                      <Check className="text-primary size-3.5 shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : currentTopic ? (
            <span className="text-muted-foreground flex items-center gap-1 truncate font-normal">
              <Folder className="size-3.5 opacity-70" />
              <span className="truncate">{currentTopic.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-1 truncate font-normal">
              <FileText className="size-3.5 opacity-70" />
              <span>Chưa phân loại</span>
            </span>
          )}

          {currentNote && (
            <>
              <span className="text-muted-foreground/40 font-mono text-[11px]">
                /
              </span>
              <span className="text-foreground truncate font-medium">
                {currentNote.title || "Trang chưa có tiêu đề"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions & Last Edited Status */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Last Edited Status (Only displayed when a note is active) */}
        {currentNote && (
          <span className="text-muted-foreground/70 mr-1 hidden items-center gap-1 font-sans text-[11px] sm:inline-flex">
            <Clock className="size-3 opacity-60" />
            {formatLastEdited()}
          </span>
        )}
        {/* PIN Lock Toggle Button */}
        {currentNote && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => requestLockToggle(currentNote, hasPrivatePin)}
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
        {currentNote && (
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
                onClick={() => setNoteToDelete(currentNote)}
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
