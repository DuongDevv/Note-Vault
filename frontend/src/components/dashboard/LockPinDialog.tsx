import { useState } from "react";
import { Lock, Unlock, Loader2, KeyRound } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PinInputGroup } from "@/components/common/PinInputGroup";
import {
  MODAL_BASE_CLASS,
  ModalIconHeader,
  ModalAlertBanner,
} from "@/components/common/ModalLayout";

interface LockPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "lock" | "unlock";
  noteTitle?: string;
  onConfirm: (pin: string) => Promise<void>;
}

export function LockPinDialog({
  open,
  onOpenChange,
  mode,
  noteTitle,
  onConfirm,
}: LockPinDialogProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pin = digits.join("");
  const isComplete = pin.length === 6;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDigits(["", "", "", "", "", ""]);
      setError(null);
      setIsLoading(false);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isComplete || isLoading) return;

    setError(null);
    setIsLoading(true);
    try {
      await onConfirm(pin);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mã PIN không chính xác");
      setDigits(["", "", "", "", "", ""]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`${MODAL_BASE_CLASS} max-w-90`}>
        <ModalIconHeader
          icon={
            mode === "lock" ? (
              <Lock className="size-5 opacity-80" />
            ) : (
              <Unlock className="size-5 opacity-80" />
            )
          }
          title={mode === "lock" ? "Khóa bảo mật ghi chú" : "Bỏ khóa bảo vệ"}
          description={
            mode === "lock"
              ? `Nhập mã Master PIN 6 số để mã hóa và khóa "${noteTitle ?? "ghi chú này"}".`
              : "Nhập mã Master PIN 6 số để gỡ bỏ khóa bảo vệ."
          }
        />

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mt-2 flex flex-col gap-4"
        >
          <ModalAlertBanner message={error} />

          <PinInputGroup
            value={digits}
            onChange={setDigits}
            autoFocus={open}
            disabled={isLoading}
          />

          <Button
            type="submit"
            disabled={isLoading || !isComplete}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 h-9 w-full cursor-pointer rounded-lg text-xs font-medium shadow-none transition-all disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <span className="flex items-center gap-1.5">
                <KeyRound className="size-3.5" />
                <span>
                  {mode === "lock" ? "Khóa ghi chú" : "Mở và gỡ khóa"}
                </span>
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
