import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";
import { NoteTagBadge } from "@/components/dashboard/NoteTagBadge";
import type { Note } from "@/types/note";

interface NoteDetailDialogProps {
  open: boolean;
  note: Note | null;
  onOpenChange: (open: boolean) => void;
}

export function NoteDetailDialog({
  open,
  note,
  onOpenChange,
}: NoteDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground sm:max-w-[560px]">
        {note && (
          <>
            <DialogHeader>
              <NoteTagBadge tag={note.tag} isLocked={note.isLocked} />
              <DialogTitle className="text-foreground mt-2">
                {note.title}
              </DialogTitle>
              <span className="text-muted-foreground flex items-center gap-1.5 font-mono text-xs">
                <Calendar className="size-3.5" />
                {note.date}
              </span>
            </DialogHeader>

            <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-line">
              {note.content}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}