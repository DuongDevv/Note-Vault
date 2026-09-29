import type { ReactNode } from "react";
import { Lock, Unlock, Copy, Trash2 } from "lucide-react";
import type { Note } from "@/types/note";
import { useUIStore } from "@/stores/useUIStore";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface NoteContextMenuProps {
  note: Note;
  hasPrivatePin?: boolean;
  children: ReactNode;
}

export function NoteContextMenuContent({
  note,
  hasPrivatePin,
}: {
  note: Note;
  hasPrivatePin?: boolean;
}) {
  const requestLockToggle = useUIStore((s) => s.requestLockToggle);
  const setNoteToDelete = useUIStore((s) => s.setNoteToDelete);

  return (
    <ContextMenuContent className="w-48 text-xs">
      <ContextMenuItem
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
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => {
          if (typeof navigator !== "undefined") {
            void navigator.clipboard.writeText(note.title);
          }
        }}
        className="flex cursor-pointer items-center gap-2"
      >
        <Copy className="text-muted-foreground size-3.5" />
        <span>Sao chép tiêu đề</span>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        variant="destructive"
        onClick={() => setNoteToDelete(note)}
      >
        <Trash2 className="size-3.5" />
        <span>Xóa trang</span>
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

/**
 * Convenience wrapper component that wraps any trigger element with NoteContextMenuContent.
 */
export function NoteContextMenu({
  note,
  hasPrivatePin,
  children,
}: NoteContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full">{children}</ContextMenuTrigger>
      <NoteContextMenuContent note={note} hasPrivatePin={hasPrivatePin} />
    </ContextMenu>
  );
}
