import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteDialogProps {
  open: boolean;
  noteTitle?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  open,
  noteTitle,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Xóa ghi chú?</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-sm">
          {noteTitle
            ? `Bạn có chắc muốn xóa ghi chú "${noteTitle}"? Hành động này không thể hoàn tác.`
            : "Bạn có chắc muốn xóa ghi chú này? Hành động này không thể hoàn tác."}
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}