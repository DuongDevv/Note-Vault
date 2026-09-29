import type { ReactNode } from "react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * Shared base visual tokens for modals and card dialogs.
 * Keep max-width out of this constant so call sites define their own sizing.
 */
export const MODAL_BASE_CLASS = "border-border/80 rounded-2xl p-6 shadow-xl";

export interface ModalIconHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

/**
 * Standard centered icon header for DialogContent modals.
 */
export function ModalIconHeader({
  icon,
  title,
  description,
  className,
}: ModalIconHeaderProps) {
  return (
    <DialogHeader className={className ?? "pb-2 text-center"}>
      <div className="bg-muted/60 text-foreground mx-auto mb-2.5 flex size-11 items-center justify-center rounded-2xl">
        {icon}
      </div>
      <DialogTitle className="text-foreground text-base font-semibold tracking-tight">
        {title}
      </DialogTitle>
      {description && (
        <DialogDescription className="text-muted-foreground pt-1 text-xs leading-relaxed">
          {description}
        </DialogDescription>
      )}
    </DialogHeader>
  );
}

/**
 * Standard centered icon header for Card containers (e.g. inline unlock canvas).
 */
export function CardIconHeader({
  icon,
  title,
  description,
  className,
}: ModalIconHeaderProps) {
  return (
    <CardHeader className={className ?? "p-0 pb-3 text-center"}>
      <div className="bg-muted/60 text-foreground mx-auto mb-2.5 flex size-11 items-center justify-center rounded-2xl">
        {icon}
      </div>
      <CardTitle className="text-foreground text-base font-semibold tracking-tight">
        {title}
      </CardTitle>
      {description && (
        <CardDescription className="text-muted-foreground pt-1 text-xs leading-relaxed">
          {description}
        </CardDescription>
      )}
    </CardHeader>
  );
}

export interface ModalAlertBannerProps {
  message?: string | null;
  variant?: "error" | "success";
  className?: string;
}

/**
 * Unified alert/error feedback banner for forms inside modals.
 */
export function ModalAlertBanner({
  message,
  variant = "error",
  className = "",
}: ModalAlertBannerProps) {
  if (!message) return null;

  const variantStyles =
    variant === "error"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center text-xs font-medium ${variantStyles} ${className}`.trim()}
    >
      {message}
    </div>
  );
}
