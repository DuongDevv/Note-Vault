import { Calendar } from "lucide-react";
import type { Note, ViewMode } from "@/types/note";
import { NoteTagBadge } from "@/components/dashboard/NoteTagBadge";
import { NoteActionMenu } from "@/components/dashboard/NoteActionMenu";

interface NoteCardProps {
  note: Note;
  viewMode: ViewMode;
  onOpen?: (note: Note) => void;
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string) => void;
}

export function NoteCard({
  note,
  viewMode,
  onOpen,
  onDelete,
  onToggleLock,
}: NoteCardProps) {
  if (viewMode === "list") {
    return (
      <article
        onClick={(e) => {
          if (
            e.target instanceof HTMLElement &&
            e.target.closest("button, [role='menuitem']")
          ) {
            return;
          }
          onOpen?.(note);
        }}
        className="group bg-card border-border flex cursor-pointer flex-col items-start justify-between gap-4 rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md sm:flex-row sm:items-center"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <NoteTagBadge tag={note.tag} isLocked={note.isLocked} />
            <h3 className="text-foreground group-hover:text-primary ml-1 truncate text-sm font-semibold transition-colors">
              {note.title}
            </h3>
          </div>
          <p className="text-muted-foreground line-clamp-1 text-xs leading-relaxed">
            {note.excerpt}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-6 self-end sm:self-center">
          <span className="text-muted-foreground flex items-center gap-1.5 font-mono text-xs">
            <Calendar className="size-3.5" />
            {note.date}
          </span>

          <NoteActionMenu
            noteId={note.id}
            isLocked={note.isLocked}
            onDelete={onDelete}
            onToggleLock={onToggleLock}
          />
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={(e) => {
        if (
          e.target instanceof HTMLElement &&
          e.target.closest("button, [role='menuitem']")
        ) {
          return;
        }
        onOpen?.(note);
      }}
      className="group bg-card border-border flex min-h-55 cursor-pointer flex-col justify-between rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <NoteTagBadge tag={note.tag} isLocked={note.isLocked} />
          <NoteActionMenu
            noteId={note.id}
            isLocked={note.isLocked}
            className="opacity-0 transition-opacity group-hover:opacity-100"
            onDelete={onDelete}
            onToggleLock={onToggleLock}
          />
        </div>

        <h3 className="text-foreground group-hover:text-primary line-clamp-1 text-base font-semibold transition-colors">
          {note.title}
        </h3>
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
          {note.excerpt}
        </p>
      </div>

      <div className="bg-muted/30 border-border/40 -mx-5 mt-4 -mb-5 flex items-center justify-between rounded-b-xl border-t px-5 py-3 pt-3">
        <span className="text-muted-foreground flex items-center gap-1.5 font-mono text-xs">
          <Calendar className="size-3.5" />
          {note.date}
        </span>
      </div>
    </article>
  );
}
