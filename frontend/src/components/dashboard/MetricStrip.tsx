import { BookOpen, LockKeyhole, Tag, Clock } from "lucide-react";
import type { MetricItem } from "@/types/note";

interface MetricStripProps {
  metrics: MetricItem[];
}

export function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      {metrics.map((metric) => {
        return (
          <div
            key={metric.id}
            className="bg-card border-border flex items-center justify-between rounded-xl border p-4 shadow-sm transition-colors"
          >
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">
                {metric.label}
              </span>
              <span className={`text-foreground mt-0.5 text-xl font-semibold`}>
                {metric.value}
              </span>
            </div>

            <div
              className={`bg-muted text-secondary-foreground flex h-9 w-9 items-center justify-center rounded-lg`}
            >
              {metric.id === "total" && <BookOpen className="size-5" />}
              {metric.id === "encrypted" && <LockKeyhole className="size-5" />}
              {metric.id === "tags" && <Tag className="size-5" />}
              {metric.id === "review" && <Clock className="size-5" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
