import { useParams, useNavigate } from "react-router-dom";
import type { Note, Topic } from "@/types/note";
import { NoteEditor } from "./NoteEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface NoteEditorPageProps {
  notes: Note[];
  topics: Topic[];
  isLoading: boolean;
  onSave?: (updated: {
    id: string;
    title: string;
    excerpt: string;
    content?: string;
  }) => void;
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string) => void;
}

export function NoteEditorPage({
  notes,
  topics,
  isLoading,
  onSave,
  onDelete,
  onToggleLock,
}: NoteEditorPageProps) {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();

  const note = notes.find((n) => n.id === noteId);

  if (isLoading && !note) {
    return (
      <main className="bg-background w-full flex-1 px-4 pt-4 pb-28 md:px-8 md:pt-6 md:pb-8">
        <div className="bg-card border-border mx-auto flex w-full max-w-[760px] flex-col gap-6 rounded-2xl border p-6 shadow-xs md:p-10">
          <Skeleton className="h-10 w-2/3 rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </main>
    );
  }

  if (!note) {
    return (
      <main className="bg-background w-full flex-1 px-4 pt-8 pb-28 md:px-8 md:pt-12 md:pb-8">
        <div className="bg-card border-border mx-auto flex w-full max-w-[540px] flex-col items-center gap-4 rounded-2xl border p-8 text-center shadow-xs sm:p-12">
          <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full text-lg font-bold">
            ?
          </div>
          <h2 className="text-foreground text-lg font-semibold">
            Không tìm thấy ghi chú
          </h2>
          <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
            Ghi chú này có thể đã bị xóa hoặc đường dẫn liên kết không chính
            xác.
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => void navigate("/")}
            className="mt-2 cursor-pointer text-xs"
          >
            Quay lại danh sách ghi chú
          </Button>
        </div>
      </main>
    );
  }

  const topicName =
    topics.find((t) => t.id === note.topicId)?.name ?? "Ghi chú";

  return (
    <main className="bg-background w-full flex-1 px-4 pt-4 pb-28 md:px-8 md:pt-6 md:pb-8">
      <NoteEditor
        note={note}
        topicName={topicName}
        onSave={onSave}
        onDelete={(id) => {
          onDelete?.(id);
          void navigate("/");
        }}
        onToggleLock={onToggleLock}
      />
    </main>
  );
}
