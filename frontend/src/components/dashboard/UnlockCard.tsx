import { useState } from "react";
import { Lock, KeyRound, Loader2 } from "lucide-react";
import { PinInputGroup } from "@/components/common/PinInputGroup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import {
  MODAL_BASE_CLASS,
  CardIconHeader,
  ModalAlertBanner,
} from "@/components/common/ModalLayout";

export interface UnlockCardProps {
  noteId: string;
  onUnlockWithPin?: (noteId: string, pin: string) => Promise<boolean>;
  onSuccess?: (noteId: string) => void;
}

export function UnlockCard({ noteId, onUnlockWithPin, onSuccess }: UnlockCardProps) {
  const storeUnlock = useWorkspaceStore((s) => s.unlockNoteWithPin);
  const storeSuccess = useWorkspaceStore((s) => s.setUnlockedNoteId);
  const handleUnlockWithPin = onUnlockWithPin ?? storeUnlock;
  const handleSuccess = onSuccess ?? storeSuccess;

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorKey, setErrorKey] = useState(0);

  const pin = digits.join("");
  const isComplete = pin.length === 6;

  const handleUnlock = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pin.length !== 6) return;
    setPinError(null);
    setIsUnlocking(true);

    try {
      const ok = await handleUnlockWithPin(noteId, pin);
      if (ok) {
        handleSuccess(noteId);
      } else {
        setPinError("Mã PIN không chính xác");
        setDigits(["", "", "", "", "", ""]);
        setErrorKey((k) => k + 1);
      }
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Mã PIN không đúng");
      setDigits(["", "", "", "", "", ""]);
      setErrorKey((k) => k + 1);
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center p-4">
      <Card className={`${MODAL_BASE_CLASS} w-full max-w-90`}>
        <CardIconHeader
          icon={<Lock className="size-5 opacity-80" />}
          title="Ghi chú đã được khóa bảo mật"
          description="Nhập mã Master PIN 6 số để giải mã nội dung tài liệu."
        />
        <CardContent className="p-0">
          <form onSubmit={(e) => void handleUnlock(e)} className="mt-2 flex flex-col gap-4">
            <ModalAlertBanner message={pinError} />

            <PinInputGroup key={errorKey} value={digits} onChange={setDigits} autoFocus={true} />

            <Button
              type="submit"
              disabled={isUnlocking || !isComplete}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-1 h-9 w-full cursor-pointer rounded-lg text-xs font-medium shadow-none transition-all disabled:opacity-40"
            >
              {isUnlocking ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <KeyRound className="size-3.5" />
                  <span>Mở khóa tài liệu</span>
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
