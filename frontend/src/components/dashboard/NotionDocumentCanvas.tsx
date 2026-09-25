import { useState, useRef, useEffect } from "react";
import { Plus, Lock, KeyRound, Loader2, FileText } from "lucide-react";
import type { Note, Topic } from "@/types/note";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface NotionDocumentCanvasProps {
  note?: Note | null;
  topics: Topic[];
  isLoading?: boolean;
  onSaveNote?: (updated: {
    id: string;
    title: string;
    excerpt: string;
    content?: string;
  }) => void;
  onNewNote?: () => void;
  onSavingStatusChange?: (isSaving: boolean) => void;
  onUnlockWithPin?: (noteId: string, pin: string) => Promise<boolean>;
}

function CanvasPinInputGroup({
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
    <div className="flex items-center justify-center gap-1.5 py-1 select-none sm:gap-2">
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

export function NotionDocumentCanvas({
  note,
  topics,
  isLoading,
  onSaveNote,
  onNewNote,
  onSavingStatusChange,
  onUnlockWithPin,
}: NotionDocumentCanvasProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedNoteId, setUnlockedNoteId] = useState<string | null>(null);
  const isUnlockedLocally = Boolean(note?.id && unlockedNoteId === note.id);
  const topicName = topics.find((t) => t.id === note?.topicId)?.name;
  const pin = digits.join("");
  const isComplete = pin.length === 6;

  const handleUnlock = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pin.length !== 6 || !note || !onUnlockWithPin) return;
    setPinError(null);
    setIsUnlocking(true);

    try {
      const ok = await onUnlockWithPin(note.id, pin);
      if (ok) {
        setUnlockedNoteId(note.id);
        setDigits(["", "", "", "", "", ""]);
      } else {
        setPinError("Mã PIN không chính xác");
        setDigits(["", "", "", "", "", ""]);
      }
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Mã PIN không đúng");
      setDigits(["", "", "", "", "", ""]);
    } finally {
      setIsUnlocking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin opacity-50" />
      </div>
    );
  }

  // If no note is selected or exists
  if (!note) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="bg-muted/50 text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
          <FileText className="size-6 opacity-60" />
        </div>
        <div className="flex max-w-sm flex-col gap-1">
          <h2 className="text-foreground text-base font-semibold tracking-tight">
            Chưa có ghi chú nào được chọn
          </h2>
          <p className="text-muted-foreground text-xs">
            Chọn một trang từ thanh bên hoặc tạo trang mới để bắt đầu viết.
          </p>
        </div>
        {onNewNote && (
          <Button
            type="button"
            onClick={onNewNote}
            className="mt-2 h-8 cursor-pointer rounded-lg px-3.5 text-xs font-medium shadow-none"
          >
            <Plus className="mr-1.5 size-3.5" />
            <span>Tạo trang mới</span>
          </Button>
        )}
      </div>
    );
  }

  // If note is locked and not yet unlocked
  if (note.isLocked && !isUnlockedLocally && note.content === null) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center p-4">
        <Card className="border-border/80 w-full max-w-[360px] rounded-2xl p-6 shadow-xl">
          <CardHeader className="p-0 pb-3 text-center">
            <div className="bg-muted/60 text-foreground mx-auto mb-2.5 flex size-11 items-center justify-center rounded-2xl">
              <Lock className="size-5 opacity-80" />
            </div>
            <CardTitle className="text-foreground text-base font-semibold tracking-tight">
              Ghi chú đã được khóa bảo mật
            </CardTitle>
            <CardDescription className="text-muted-foreground pt-1 text-xs leading-relaxed">
              Nhập mã Master PIN 6 số để giải mã nội dung tài liệu.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form
              onSubmit={(e) => void handleUnlock(e)}
              className="mt-2 flex flex-col gap-4"
            >
              {pinError && (
                <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border px-3 py-2 text-center text-xs font-medium">
                  {pinError}
                </div>
              )}

              <CanvasPinInputGroup
                value={digits}
                onChange={setDigits}
                autoFocus={true}
              />

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

  return (
    <div className="w-full flex-1 overflow-y-auto">
      <NoteEditor
        key={note.id}
        note={note}
        topicName={topicName}
        onSave={onSaveNote}
        onSavingStatusChange={onSavingStatusChange}
      />
    </div>
  );
}
