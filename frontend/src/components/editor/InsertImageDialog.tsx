import { useState, useRef, type ChangeEvent } from "react";
import type { Editor } from "@tiptap/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Upload, Link2 } from "lucide-react";

interface InsertImageDialogProps {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsertImageDialog({
  editor,
  open,
  onOpenChange,
}: InsertImageDialogProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [previewSrc, setPreviewSrc] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetState = () => {
    setImageUrl("");
    setPreviewSrc("");
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleUrlChange = (val: string) => {
    setImageUrl(val);
    setError(null);
    if (
      val.trim().startsWith("http://") ||
      val.trim().startsWith("https://") ||
      val.trim().startsWith("data:image/")
    ) {
      setPreviewSrc(val.trim());
    } else if (!val.trim()) {
      setPreviewSrc("");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Tệp đã chọn không phải định dạng hình ảnh hợp lệ.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = reader.result;
      if (typeof result === "string") {
        setPreviewSrc(result);
        setImageUrl(result);
        setError(null);
      }
    });
    reader.addEventListener("error", () => {
      setError("Không thể đọc tệp hình ảnh.");
    });
    reader.readAsDataURL(file);
  };

  const handleInsert = () => {
    if (!editor || !previewSrc) return;

    editor
      .chain()
      .focus()
      .setImage({
        src: previewSrc,
        alt: "Hình ảnh ghi chú",
      })
      .run();

    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary border-primary/20 flex size-7 shrink-0 items-center justify-center rounded-lg border">
              <ImageIcon className="size-4" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              Chèn hình ảnh
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs">
            Tải ảnh từ máy tính hoặc dán liên kết URL hình ảnh vào ghi chú.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          {/* File Upload Trigger */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="hover:bg-muted/50 w-full cursor-pointer gap-2 border-dashed py-5 text-xs font-medium"
            >
              <Upload className="text-muted-foreground size-4" />
              <span>Tải ảnh lên từ máy tính (PNG, JPG, WebP, GIF)</span>
            </Button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-border w-full border-t" />
            <span className="bg-background text-muted-foreground absolute px-2 text-[10px] tracking-wider uppercase">
              Hoặc dùng liên kết
            </span>
          </div>

          {/* URL Input */}
          <div>
            <label className="text-muted-foreground mb-1 block text-xs font-medium">
              Đường dẫn hình ảnh (URL)
            </label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2">
                <Link2 className="size-3.5" />
              </span>
              <input
                type="url"
                value={
                  imageUrl.startsWith("data:")
                    ? "(Ảnh đã chọn từ tệp thiết bị)"
                    : imageUrl
                }
                disabled={imageUrl.startsWith("data:")}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/image.png"
                className="border-input bg-background/50 focus-visible:ring-ring w-full rounded-md border py-1.5 pr-2.5 pl-8 text-xs focus-visible:ring-1 focus-visible:outline-none disabled:opacity-75"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && <p className="text-destructive text-xs">{error}</p>}

          {/* Preview Box */}
          {previewSrc && (
            <div className="border-border/70 bg-muted/20 overflow-hidden rounded-lg border p-2">
              <p className="text-muted-foreground mb-1.5 text-[11px] font-medium">
                Xem trước:
              </p>
              <div className="flex max-h-44 items-center justify-center overflow-hidden rounded bg-black/10 dark:bg-black/30">
                <img
                  src={previewSrc}
                  alt="Xem trước hình ảnh"
                  className="max-h-40 max-w-full rounded object-contain"
                  onError={() => {
                    setError("Không thể tải hình ảnh từ liên kết đã nhập.");
                    setPreviewSrc("");
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
            className="text-xs"
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleInsert}
            disabled={!previewSrc}
            className="cursor-pointer text-xs font-medium"
          >
            Chèn hình ảnh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
