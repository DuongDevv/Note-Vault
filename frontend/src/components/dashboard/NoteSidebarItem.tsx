import { FileText, Lock } from "lucide-react";
import type { Note } from "@/types/note";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { NoteActionMenu } from "@/components/dashboard/NoteActionMenu";

interface NoteSidebarItemProps {
  note: Note;
  isActive: boolean;
  hasPrivatePin?: boolean;
  onSelect: (noteId: string) => void;
}

export function NoteSidebarItem({ note, isActive, onSelect }: NoteSidebarItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => onSelect(note.id)}
        className={`h-8 w-full cursor-pointer justify-start rounded-md px-2 pr-7 text-[13px] transition-colors ${
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60"
        }`}
      >
        {note.isLocked ? (
          <Lock className="text-muted-foreground size-3.5 shrink-0 opacity-70" />
        ) : (
          <FileText className="text-muted-foreground size-3.5 shrink-0 opacity-70" />
        )}
        <span className="truncate text-[13px]">{note.title || "Trang chưa có tiêu đề"}</span>
      </SidebarMenuButton>
      <NoteActionMenu note={note} />
    </SidebarMenuItem>
  );
}
