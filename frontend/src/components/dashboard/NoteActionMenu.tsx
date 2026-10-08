import {
  Lock,
  Unlock,
  Copy,
  Trash2,
  MoreHorizontal,
  Folder,
  FileText,
  Check,
  FolderSync,
  Pin,
  PinOff,
} from "lucide-react";
import type { Note } from "@/types/note";
import { useUIStore } from "@/stores/useUIStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuAction } from "@/components/ui/sidebar";

export interface NoteActionMenuProps {
  note: Note;
  hasPrivatePin?: boolean;
}

/**
 * 3-dots hover action menu button (SidebarMenuAction showOnHover) with DropdownMenu.
 */
export function NoteActionMenu({ note, hasPrivatePin }: NoteActionMenuProps) {
  const requestLockToggle = useUIStore((s) => s.requestLockToggle);
  const setNoteToDelete = useUIStore((s) => s.setNoteToDelete);
  const topics = useWorkspaceStore((s) => s.topics);
  const moveNoteToTopic = useWorkspaceStore((s) => s.moveNoteToTopic);
  const toggleNotePin = useWorkspaceStore((s) => s.toggleNotePin);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuAction
            showOnHover
            className="text-muted-foreground hover:text-foreground cursor-pointer rounded"
            title="Tùy chọn trang"
            aria-label="Tùy chọn trang"
          />
        }
      >
        <MoreHorizontal className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-48 text-xs"
      >
        <DropdownMenuItem
          onClick={() => void toggleNotePin(note.id)}
          className="flex cursor-pointer items-center gap-2"
        >
          {note.isPinned ? (
            <>
              <PinOff className="text-muted-foreground size-3.5" />
              <span>Bỏ ghim trang</span>
            </>
          ) : (
            <>
              <Pin className="text-muted-foreground size-3.5" />
              <span>Ghim trang</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => requestLockToggle(note, hasPrivatePin)}
          className="flex cursor-pointer items-center gap-2"
        >
          {note.isLocked ? (
            <>
              <Unlock className="size-3.5" />
              <span>Bỏ khóa PIN</span>
            </>
          ) : (
            <>
              <Lock className="size-3.5" />
              <span>Khóa bằng mã PIN</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (typeof navigator !== "undefined") {
              void navigator.clipboard.writeText(note.title);
            }
          }}
          className="flex cursor-pointer items-center gap-2"
        >
          <Copy className="text-muted-foreground size-3.5" />
          <span>Sao chép tiêu đề</span>
        </DropdownMenuItem>

        {/* Move to Topic Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex cursor-pointer items-center gap-2">
            <FolderSync className="text-muted-foreground size-3.5" />
            <span>Chuyển chủ đề</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48 text-xs">
            <DropdownMenuItem
              onClick={() => void moveNoteToTopic(note.id, null)}
              className="flex cursor-pointer items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <FileText className="text-muted-foreground size-3.5" />
                <span>Chưa phân loại</span>
              </span>
              {!note.topicId && <Check className="text-primary size-3.5" />}
            </DropdownMenuItem>
            {topics.length > 0 && <DropdownMenuSeparator />}
            {topics.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => void moveNoteToTopic(note.id, t.id)}
                className="flex cursor-pointer items-center justify-between"
              >
                <span className="flex items-center gap-2 truncate">
                  <Folder className="text-muted-foreground size-3.5 shrink-0" />
                  <span className="truncate">{t.name}</span>
                </span>
                {note.topicId === t.id && (
                  <Check className="text-primary size-3.5 shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => setNoteToDelete(note)}
          className="flex cursor-pointer items-center gap-2"
        >
          <Trash2 className="size-3.5" />
          <span>Xóa trang</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
