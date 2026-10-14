import { cn } from "cn";

export interface LoadingScreenProps {
  className?: string;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ className, message, fullScreen = true }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "bg-background flex items-center justify-center",
        fullScreen ? "min-h-screen w-full" : "h-full w-full p-4",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
        {message && <p className="text-muted-foreground text-xs">{message}</p>}
      </div>
    </div>
  );
}
