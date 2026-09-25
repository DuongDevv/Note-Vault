import { useState, useRef, useEffect } from "react";
import { Lock, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updatePrivatePin } from "@/services/auth";

interface PinSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasExistingPin?: boolean;
  onPinUpdated?: () => void;
}

function PinInputGroup({
  value,
  onChange,
  autoFocus = false,
}: {
  value: string[];
  onChange: (val: string[]) => void;
  autoFocus?: boolean;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) return;

    const next = [...value];
    if (rawVal.length > 1) {
      // Handle paste
      const digits = rawVal.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        next[i] = digits[i] || "";
      }
      onChange(next);
      const targetFocus = Math.min(digits.length, 5);
      inputsRef.current[targetFocus]?.focus();
      return;
    }

    next[index] = rawVal[rawVal.length - 1] || "";
    onChange(next);

    // Auto-advance
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        const next = [...value];
        next[index - 1] = "";
        onChange(next);
        inputsRef.current[index - 1]?.focus();
      } else {
        const next = [...value];
        next[index] = "";
        onChange(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-1.5 select-none sm:gap-2">
      {/* Group 1: 3 digits */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={value[idx] || ""}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="border-border/70 bg-muted/40 text-foreground focus:border-foreground/80 focus:bg-background focus:ring-foreground/80 size-9 rounded-lg border text-center font-mono text-base font-semibold shadow-2xs transition-all focus:ring-1 focus:outline-none sm:size-10"
          />
        ))}
      </div>

      <span className="text-muted-foreground/40 font-mono text-sm">·</span>

      {/* Group 2: 3 digits */}
      <div className="flex items-center gap-1.5">
        {[3, 4, 5].map((idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={value[idx] || ""}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="border-border/70 bg-muted/40 text-foreground focus:border-foreground/80 focus:bg-background focus:ring-foreground/80 size-9 rounded-lg border text-center font-mono text-base font-semibold shadow-2xs transition-all focus:ring-1 focus:outline-none sm:size-10"
          />
        ))}
      </div>
    </div>
  );
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
      <DialogContent className="border-border/80 max-w-[380px] rounded-2xl p-6 shadow-xl">
        <DialogHeader className="pb-2 text-center">
          <div className="bg-muted/60 text-foreground mx-auto mb-2.5 flex size-11 items-center justify-center rounded-2xl">
            <Lock className="size-5 opacity-80" />
          </div>
          <DialogTitle className="text-foreground text-base font-semibold tracking-tight">
            {hasExistingPin ? "Đổi mã Master PIN" : "Thiết lập mã Master PIN"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-1 text-xs leading-relaxed">
            Mã PIN 6 số dùng để giải mã và bảo vệ ghi chú riêng tư.
          </DialogDescription>
        </DialogHeader>

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
            {error && (
              <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border px-3 py-2 text-center text-xs font-medium">
                {error}
              </div>
            )}

            {/* PIN Row 1 */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-muted-foreground text-[11px] font-medium">
                Nhập mã PIN mới (6 số)
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
