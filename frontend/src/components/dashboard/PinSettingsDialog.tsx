import { useState } from "react";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
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
  const [currentDigits, setCurrentDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
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
  const [isLoading, setIsLoading] = useState(false);

  const currentPin = currentDigits.join("");
  const pin = pinDigits.join("");
  const confirmPin = confirmDigits.join("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (
      hasExistingPin &&
      (currentPin.length !== 6 || !/^\d{6}$/.test(currentPin))
    ) {
      setError("Vui lòng nhập đủ 6 chữ số mã PIN hiện tại");
      return;
    }

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError("Vui lòng nhập đủ 6 chữ số mã PIN mới");
      return;
    }

    if (pin !== confirmPin) {
      setError("Mã PIN xác nhận không trùng khớp");
      return;
    }

    if (hasExistingPin && currentPin === pin) {
      setError("Mã PIN mới phải khác mã PIN hiện tại");
      return;
    }

    setIsLoading(true);
    try {
      await updatePrivatePin(pin, hasExistingPin ? currentPin : undefined);
      setCurrentDigits(["", "", "", "", "", ""]);
      setPinDigits(["", "", "", "", "", ""]);
      setConfirmDigits(["", "", "", "", "", ""]);
      onOpenChange(false);
      onPinUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
      setCurrentDigits(["", "", "", "", "", ""]);
      setPinDigits(["", "", "", "", "", ""]);
      setConfirmDigits(["", "", "", "", "", ""]);
    }
    onOpenChange(nextOpen);
  };

  const isFormComplete =
    (!hasExistingPin || currentPin.length === 6) &&
    pin.length === 6 &&
    confirmPin.length === 6;

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

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mt-2 flex flex-col gap-4"
        >
          <ModalAlertBanner message={error} />
          {/* Current PIN Row (chỉ hiển thị khi đã có PIN) */}
          {hasExistingPin && (
            <div className="flex flex-col items-center gap-1.5 pb-1">
              <span className="text-muted-foreground text-[11px] font-medium">
                Nhập mã PIN hiện tại
              </span>
              <PinInputGroup
                value={currentDigits}
                onChange={setCurrentDigits}
                autoFocus={true}
              />
            </div>
          )}

          {/* PIN Row 1 */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-muted-foreground text-[11px] font-medium">
              {hasExistingPin ? "Nhập mã PIN mới" : "Nhập mã PIN"}
            </span>
            <PinInputGroup
              value={pinDigits}
              onChange={setPinDigits}
              autoFocus={!hasExistingPin}
            />
          </div>
          {/* PIN Row 2 */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <span className="text-muted-foreground text-[11px] font-medium">
              Xác nhận lại mã PIN
            </span>
            <PinInputGroup value={confirmDigits} onChange={setConfirmDigits} />
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
      </DialogContent>
    </Dialog>
  );
}
