import { useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import type {
  Note,
  Topic,
  MetricItem,
  SortOption,
  ViewMode,
} from "@/types/note";
import { TopicFilterPills } from "@/components/dashboard/TopicFilterPills";
import { SortDropdown } from "@/components/dashboard/SortDropdown";
import { ViewModeSwitcher } from "@/components/dashboard/ViewModeSwitcher";
import { MetricStrip } from "@/components/dashboard/MetricStrip";
import { NoteCard } from "@/components/dashboard/NoteCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardPageProps {
  notes: Note[];
  topics: Topic[];
  metrics: MetricItem[];
  isLoading: boolean;
  searchQuery: string;
  onClearSearch: () => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenNewNote: () => void;
  onDeleteNote: (id: string) => void;
  onToggleLock: (id: string) => void;
}

export function DashboardPage({
  notes,
  topics,
  metrics,
  isLoading,
  searchQuery,
  onClearSearch,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenNewNote,
  onDeleteNote,
  onToggleLock,
}: DashboardPageProps) {
  const { topicId } = useParams<{ topicId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isLockedTab = location.pathname === "/locked";
  const activeTopicId = topicId ?? "hoc-tap";

  const activeTopic = useMemo(() => {
    return (
      topics.find((t) => t.id === activeTopicId) ?? {
        id: activeTopicId,
        name: "Ghi chú",
        icon: "folder",
        count: 0,
        path: activeTopicId,
      }
    );
  }, [topics, activeTopicId]);

  const totalNotesCount = useMemo(() => {
    return topics.reduce((sum, t) => sum + t.count, 0);
  }, [topics]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (isLockedTab) {
      result = result.filter((n) => n.isLocked);
    } else if (topicId) {
      result = result.filter((n) => n.topicId === topicId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.tag.toLowerCase().includes(q) ||
          n.excerpt.toLowerCase().includes(q),
      );
    }

    return [...result].toSorted((a, b) => {
      if (sortOption === "Theo tên (A-Z)") {
        return a.title.localeCompare(b.title, "vi");
      }
      if (sortOption === "Cũ nhất") {
        return a.id.localeCompare(b.id);
      }
      return b.id.localeCompare(a.id);
    });
  }, [notes, isLockedTab, topicId, searchQuery, sortOption]);

  const handleSelectTopic = (id: string) => {
    if (id) {
      void navigate(`/topics/${id}`);
    } else {
      void navigate("/");
    }
  };

  return (
    <main className="bg-background w-full flex-1 px-4 pt-3 pb-28 md:px-8 md:pt-6 md:pb-8">
      <div className="flex w-full flex-col">
        <div className="mx-auto flex w-full max-w-105 flex-col gap-3 md:max-w-290 md:gap-6">
          {/* Mobile Dynamic Filter Pill Bar */}
          <TopicFilterPills
            topics={topics}
            activeTopicId={activeTopicId}
            totalCount={totalNotesCount}
            onSelectTopic={handleSelectTopic}
            className="md:hidden"
          />

          {/* Top Action & Context Header (Desktop) */}
          <div className="border-border hidden flex-col justify-between gap-4 border-b pb-4 md:flex md:flex-row md:items-end">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
                  {isLockedTab
                    ? "Ghi chú bảo mật"
                    : topicId
                      ? activeTopic.name
                      : "Tất cả ghi chú"}
                </h1>
                <span className="text-muted-foreground text-xs">
                  Cập nhật 2 phút trước
                </span>
              </div>
            </div>

            {/* Right Controls Bar */}
            <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
              <SortDropdown
                sortOption={sortOption}
                onSortChange={onSortChange}
              />
              <ViewModeSwitcher
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
              />
              <Button
                type="button"
                onClick={onOpenNewNote}
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-xs font-medium shadow-sm active:scale-[0.98]"
              >
                <Plus className="size-4" />
                <span>Ghi chú mới</span>
              </Button>
            </div>
          </div>

          {/* Mobile Compact Controls Bar */}
          <div className="flex items-center justify-between gap-2 md:hidden">
            <span className="text-muted-foreground truncate text-xs font-medium">
              {isLockedTab ? "Đã khóa" : topicId ? activeTopic.name : "Tất cả"}{" "}
              ({filteredNotes.length})
            </span>
            <div className="flex items-center gap-2">
              <SortDropdown
                sortOption={sortOption}
                onSortChange={onSortChange}
              />
              <ViewModeSwitcher
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
              />
            </div>
          </div>

          {/* Quick Analytic Strip (Desktop only) */}
          <div className="hidden md:block">
            <MetricStrip metrics={metrics} />
          </div>

          {/* Notes Container (Grid or List view) */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-card border-border flex min-h-55 flex-col gap-3 rounded-xl border p-5"
                >
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                  <div className="mt-auto flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="bg-card border-border flex min-h-65 flex-col items-center justify-center gap-3 rounded-xl border p-8 text-center shadow-sm">
              <p className="text-muted-foreground text-sm">
                {searchQuery.trim()
                  ? `Không tìm thấy ghi chú nào phù hợp với từ khóa "${searchQuery}".`
                  : `Chưa có ghi chú nào trong chủ đề "${activeTopic.name}".`}
              </p>
              {searchQuery.trim() ? (
                <Button
                  variant="outline"
                  onClick={onClearSearch}
                  className="text-primary border-primary/30 cursor-pointer"
                >
                  Xóa tìm kiếm
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onOpenNewNote}
                  className="h-8 cursor-pointer text-xs"
                >
                  + Tạo ghi chú đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-3"
              }
            >
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  viewMode={viewMode}
                  onOpen={(targetNote) => {
                    void navigate(`/notes/${targetNote.id}`);
                  }}
                  onDelete={onDeleteNote}
                  onToggleLock={onToggleLock}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
