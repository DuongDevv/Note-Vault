import { useState } from "react";
import { Lock, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  MODAL_BASE_CLASS,
  ModalIconHeader,
  ModalAlertBanner,
} from "@/components/common/ModalLayout";
import { Button } from "@/components/ui/button";
import { PinInputGroup } from "@/components/common/PinInputGroup";
import { updatePrivatePin } from "@/services/auth";

interface PinSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasExistingPin?: boolean;
  onPinUpdated?: () => void;
}

export function PinSettingsDialog({
  open,
  onOpenChange,
  hasExistingPin = false,
  onPinUpdated,
}: PinSettingsDialogProps) {
  const [pinDigits, setPinDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [confirmDigits, setConfirmDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const pin = pinDigits.join("");
  const confirmPin = confirmDigits.join("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError("Vui lòng nhập đủ 6 chữ số mã PIN");
      return;
    }

    if (pin !== confirmPin) {
      setError("Mã PIN xác nhận không trùng khớp");
      return;
    }

    setIsLoading(true);
    try {
      await updatePrivatePin(pin);
      setSuccess(true);
      onPinUpdated?.();
      setTimeout(() => {
        setSuccess(false);
        setPinDigits(["", "", "", "", "", ""]);
        setConfirmDigits(["", "", "", "", "", ""]);
        onOpenChange(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
      setSuccess(false);
      setPinDigits(["", "", "", "", "", ""]);
      setConfirmDigits(["", "", "", "", "", ""]);
    }
    onOpenChange(nextOpen);
  };

  const isFormComplete = pin.length === 6 && confirmPin.length === 6;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`${MODAL_BASE_CLASS} max-w-95`}>
        <ModalIconHeader
          icon={<Lock className="size-5 opacity-80" />}
          title={
            hasExistingPin ? "Đổi mã Master PIN" : "Thiết lập mã Master PIN"
          }
          description="Mã PIN 6 số dùng để giải mã và bảo vệ ghi chú riêng tư."
        />

        {success ? (
          <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center gap-2 py-6 text-center duration-200">
            <CheckCircle2 className="size-9 text-emerald-500" />
            <p className="text-foreground text-xs font-medium">
              Đã cập nhật mã Master PIN thành công!
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="mt-2 flex flex-col gap-4"
          >
            <ModalAlertBanner message={error} />

            {/* PIN Row 1 */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-muted-foreground text-[11px] font-medium">
                Nhập mã PIN mới
              </span>
              <PinInputGroup
                value={pinDigits}
                onChange={setPinDigits}
                autoFocus={true}
              />
            </div>

            {/* PIN Row 2 */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <span className="text-muted-foreground text-[11px] font-medium">
                Xác nhận lại mã PIN
              </span>
              <PinInputGroup
                value={confirmDigits}
                onChange={setConfirmDigits}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !isFormComplete}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 h-9 w-full cursor-pointer rounded-lg text-xs font-medium shadow-none transition-all disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  <span>Lưu mã PIN</span>
                </span>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
