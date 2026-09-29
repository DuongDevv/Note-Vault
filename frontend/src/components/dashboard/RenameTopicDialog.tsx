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
import { MODAL_BASE_CLASS } from "@/components/common/ModalLayout";
import type { Topic } from "@/types/note";

interface RenameTopicDialogProps {
  topic: Topic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (topicId: string, newName: string) => Promise<void> | void;
}

export function RenameTopicDialog({
  topic,
  open,
  onOpenChange,
  onRename,
}: RenameTopicDialogProps) {
  if (!topic || !open) return null;

  return (
    <RenameTopicForm
      key={topic.id}
      topic={topic}
      open={open}
      onOpenChange={onOpenChange}
      onRename={onRename}
    />
  );
}

function RenameTopicForm({
  topic,
  open,
  onOpenChange,
  onRename,
}: {
  topic: Topic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (topicId: string, newName: string) => Promise<void> | void;
}) {
  const [name, setName] = useState(topic.name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onRename(topic.id, name.trim());
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${MODAL_BASE_CLASS} sm:max-w-[420px]`}>
        <DialogHeader>
          <DialogTitle className="text-foreground">Đổi tên chủ đề</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rename-topic-name"
              className="text-muted-foreground text-xs font-medium"
            >
              Tên chủ đề mới
            </label>
            <Input
              id="rename-topic-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên mới cho chủ đề..."
              required
              autoFocus
              className="bg-muted/40"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || !name.trim() || name.trim() === topic.name
              }
            >
              {isSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
