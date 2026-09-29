import { useRef, useEffect } from "react";

interface PinInputGroupProps {
  value: string[];
  onChange: (val: string[]) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function PinInputGroup({
  value,
  onChange,
  autoFocus = false,
  disabled = false,
}: PinInputGroupProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && !disabled) {
      const timer = setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoFocus, disabled]);

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value.replace(/\D/g, "");
    const next = [...value];

    if (!val) {
      next[index] = "";
      onChange(next);
      return;
    }

    if (val.length === 1) {
      next[index] = val;
      onChange(next);
      if (index < 5) {
        inputsRef.current[index + 1]?.focus();
      }
    } else {
      // Handle paste of multiple characters
      const chars = val.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        next[i] = chars[i] ?? "";
      }
      onChange(next);
      const focusIndex = Math.min(chars.length, 5);
      inputsRef.current[focusIndex]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (value[index] === "" && index > 0) {
        inputsRef.current[index - 1]?.focus();
      } else {
        const next = [...value];
        next[index] = "";
        onChange(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-1.5 py-1 select-none sm:gap-2">
      {value.map((digit, idx) => (
        <span key={idx} className="contents">
          {idx === 3 && (
            <span className="text-muted-foreground/40 px-0.5 text-xs select-none">
              •
            </span>
          )}
          <input
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            disabled={disabled}
            aria-label={`Chữ số PIN thứ ${idx + 1}`}
            className="border-border/80 bg-background text-foreground focus:border-foreground focus:ring-foreground/20 size-10 rounded-xl border text-center font-mono text-base font-semibold transition-all focus:ring-2 focus:outline-none disabled:opacity-50"
          />
        </span>
      ))}
    </div>
  );
}
