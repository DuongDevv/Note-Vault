import { useNavigate } from "react-router-dom";
import { Plus, FileText, Loader2 } from "lucide-react";
import type { Note } from "@/types/note";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { Button } from "@/components/ui/button";
import { UnlockCard } from "./UnlockCard";

interface DocumentCanvasProps {
  note?: Note | null;
}

export function DocumentCanvas({ note }: DocumentCanvasProps) {
  const navigate = useNavigate();
  const isLoading = useWorkspaceStore((s) => s.isLoading);
  const updateNoteContent = useWorkspaceStore((s) => s.updateNoteContent);
  const setSavingStatus = useWorkspaceStore((s) => s.setSavingStatus);
  const unlockNoteWithPin = useWorkspaceStore((s) => s.unlockNoteWithPin);
  const unlockedNoteId = useWorkspaceStore((s) => s.unlockedNoteId);
  const setUnlockedNoteId = useWorkspaceStore((s) => s.setUnlockedNoteId);
  const createNote = useWorkspaceStore((s) => s.createNote);

  const isUnlockedLocally = Boolean(note?.id && unlockedNoteId === note.id);

  const handleNewNote = async () => {
    try {
      const created = await createNote();
      void navigate(`/notes/${created.id}`);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin opacity-50" />
      </div>
    );
  }

  // If no note is selected or exists
  if (!note) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="bg-muted/50 text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
          <FileText className="size-6 opacity-60" />
        </div>
        <div className="flex max-w-sm flex-col gap-1">
          <h2 className="text-foreground text-base font-semibold tracking-tight">
            Chưa có ghi chú nào được chọn
          </h2>
          <p className="text-muted-foreground text-xs">
            Chọn một trang từ thanh bên hoặc tạo trang mới để bắt đầu viết.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void handleNewNote()}
          className="mt-2 h-8 cursor-pointer rounded-lg px-3.5 text-xs font-medium shadow-none"
        >
          <Plus className="mr-1.5 size-3.5" />
          <span>Tạo trang mới</span>
        </Button>
      </div>
    );
  }

  // If note is locked and not yet unlocked
  if (note.isLocked && !isUnlockedLocally) {
    return (
      <UnlockCard
        key={note.id}
        noteId={note.id}
        onUnlockWithPin={unlockNoteWithPin}
        onSuccess={setUnlockedNoteId}
      />
    );
  }

  return (
    <div className="w-full flex-1 overflow-y-auto">
      <NoteEditor
        key={note.id}
        note={note}
        onSave={updateNoteContent}
        onSavingStatusChange={setSavingStatus}
      />
    </div>
  );
}
