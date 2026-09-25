import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NoteTagBadgeProps {
  tag: string;
  isLocked?: boolean;
}

export function NoteTagBadge({ tag, isLocked }: NoteTagBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge
        variant="secondary"
        className="bg-secondary text-secondary-foreground border-border rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide"
      >
        {tag}
      </Badge>
      {isLocked && (
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
        >
          <Lock className="size-3" />
          <span>Khóa PIN</span>
        </Badge>
      )}
    </div>
  );
}
