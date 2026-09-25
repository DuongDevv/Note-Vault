import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, FileText, Folder, Lock, X } from "lucide-react";
import type { Note, Topic } from "@/types/note";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
interface NotionSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: Note[];
  topics: Topic[];
  onSelectNote: (noteId: string) => void;
  onSelectTopic: (topicId: string) => void;
}

export function NotionSearchModal({
  open,
  onOpenChange,
  notes,
  topics,
  onSelectNote,
  onSelectTopic,
}: NotionSearchModalProps) {
  const [query, setQuery] = useState("");

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setQuery("");
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  // Global shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleOpenChange]);

  const filteredNotes = useMemo(() => {
    if (!query.trim()) return notes.slice(0, 8);
    const q = query.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [notes, query]);

  const filteredTopics = useMemo(() => {
    if (!query.trim()) return topics.slice(0, 4);
    const q = query.toLowerCase();
    return topics.filter((t) => t.name.toLowerCase().includes(q));
  }, [topics, query]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border/80 max-w-lg gap-0 overflow-hidden p-0 shadow-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Tìm kiếm nhanh</DialogTitle>
        </DialogHeader>

        {/* Search Input Bar */}
        <div className="border-border/60 flex h-12 items-center border-b px-3.5">
          <Search className="text-muted-foreground mr-2.5 size-4 shrink-0 opacity-70" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm trang hoặc chủ đề..."
            className="text-foreground placeholder:text-muted-foreground/60 w-full border-none bg-transparent text-xs focus:ring-0 focus:outline-none sm:text-sm"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Search Results List */}
        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto p-2">
          {filteredNotes.length === 0 && filteredTopics.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-xs">
              Không tìm thấy kết quả phù hợp với &quot;{query}&quot;
            </div>
          ) : (
            <>
              {filteredNotes.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground px-2 py-1 text-[10px] font-semibold tracking-wider uppercase">
                    Ghi chú ({filteredNotes.length})
                  </span>
                  {filteredNotes.map((note) => (
                    <Button
                      key={note.id}
                      variant="ghost"
                      onClick={() => {
                        onSelectNote(note.id);
                        onOpenChange(false);
                      }}
                      className="flex h-auto w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-left font-normal transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {note.isLocked ? (
                          <Lock className="text-muted-foreground size-3.5 shrink-0 opacity-70" />
                        ) : (
                          <FileText className="text-muted-foreground size-3.5 shrink-0 opacity-70" />
                        )}
                        <span className="text-foreground truncate text-xs font-medium">
                          {note.title || "Trang chưa có tiêu đề"}
                        </span>
                      </div>
                      <span className="text-muted-foreground/60 shrink-0 text-[10px]">
                        {note.date}
                      </span>
                    </Button>
                  ))}
                </div>
              )}

              {filteredTopics.length > 0 && (
                <div className="border-border/40 mt-1 flex flex-col gap-0.5 border-t pt-1">
                  <span className="text-muted-foreground px-2 py-1 text-[10px] font-semibold tracking-wider uppercase">
                    Chủ đề ({filteredTopics.length})
                  </span>
                  {filteredTopics.map((topic) => (
                    <Button
                      key={topic.id}
                      variant="ghost"
                      onClick={() => {
                        onSelectTopic(topic.id);
                        onOpenChange(false);
                      }}
                      className="flex h-auto w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-left font-normal transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className="text-muted-foreground size-3.5 shrink-0 opacity-70" />
                        <span className="text-foreground truncate text-xs font-medium">
                          {topic.name}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
