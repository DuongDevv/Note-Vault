import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewNotePayload {
  title: string;
  tag: string;
  topicId: string;
  isLocked: boolean;
  excerpt: string;
}

interface NewNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTopicId: string;
  onAddNote: (note: NewNotePayload) => Promise<void> | void;
}

export function NewNoteDialog({
  open,
  onOpenChange,
  activeTopicId,
  onAddNote,
}: NewNoteDialogProps) {
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("#GhiChú");
  const [excerpt, setExcerpt] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddNote({
        title: title.trim(),
        tag: tag.startsWith("#") ? tag : `#${tag}`,
        topicId: activeTopicId,
        isLocked,
        excerpt:
          excerpt.trim() ||
          "Nội dung ghi chú mới được khởi tạo và lưu an toàn trong NoteVault...",
      });

      setTitle("");
      setExcerpt("");
      setIsLocked(false);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Tạo ghi chú mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="note-title"
              className="text-muted-foreground text-xs font-medium"
            >
              Tiêu đề ghi chú
            </label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ý tưởng thiết kế giao diện..."
              required
              className="bg-muted/40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="note-tag"
              className="text-muted-foreground text-xs font-medium"
            >
              Thẻ chủ đề (Tag)
            </label>
            <Input
              id="note-tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="#KỹThuật, #ÝTưởng..."
              className="bg-muted/40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="note-excerpt"
              className="text-muted-foreground text-xs font-medium"
            >
              Nội dung tóm tắt
            </label>
            <textarea
              id="note-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="Nhập mô tả tóm tắt ngắn cho ghi chú..."
              className="border-input bg-muted/40 text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-3"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="note-locked"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="border-input text-primary focus:ring-primary h-4 w-4 rounded"
            />
            <label
              htmlFor="note-locked"
              className="text-foreground cursor-pointer text-sm select-none"
            >
              Khóa ghi chú bằng mã PIN (Yêu cầu mã PIN khi xem)
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu…" : "Tạo ghi chú"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
