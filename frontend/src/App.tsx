import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { MetricStrip } from "@/components/dashboard/MetricStrip";
import { NoteCard } from "@/components/dashboard/NoteCard";
import { NewNoteDialog } from "@/components/dashboard/NewNoteDialog";
import { NewTopicDialog } from "@/components/dashboard/NewTopicDialog";
import { ConfirmDeleteDialog } from "./components/dashboard/ConfirmDelete";
import { NoteDetailDialog } from "./components/dashboard/NoteDetail";
import { SortDropdown } from "@/components/dashboard/SortDropdown";
import { ViewModeSwitcher } from "@/components/dashboard/ViewModeSwitcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MobileBottomNav,
  type MobileTab,
} from "@/components/dashboard/MobileBottomNav";
import { TopicFilterPills } from "@/components/dashboard/TopicFilterPills";
import {
  fetchTopics,
  fetchNotes,
  fetchMetrics,
  createTopic,
  createNote,
  deleteNote,
  toggleNoteLock,
} from "@/services/api";
import type {
  Note,
  Topic,
  MetricItem,
  SortOption,
  ViewMode,
} from "@/types/note";

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("notevault-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("notevault-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Data state loaded via MSW API
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopicId, setActiveTopicId] = useState<string>("hoc-tap");
  const [notes, setNotes] = useState<Note[]>([]);
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Controls state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("Mới nhất");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Modals state
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>("notes");


  // Load initial topics and metrics from MSW API
  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [fetchedTopics, fetchedMetrics] = await Promise.all([
          fetchTopics(),
          fetchMetrics(),
        ]);

        if (ignore) return;

        setTopics(fetchedTopics);
        setMetrics(fetchedMetrics);
        if (
          fetchedTopics.length > 0 &&
          !fetchedTopics.some((t) => t.id === activeTopicId)
        ) {
          setActiveTopicId(fetchedTopics[0].id);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu khởi tạo:", err);
      }
    }

    void init();
    return () => {
      ignore = true;
    };
  }, [activeTopicId]);

  // Load notes whenever activeTopic changes
  useEffect(() => {
    let ignore = false;

    async function fetchCurrentNotes() {
      try {
        const fetchedNotes = await fetchNotes(activeTopicId);
        if (!ignore) {
          setNotes(fetchedNotes);
        }
      } catch (err) {
        console.error("Lỗi khi tải ghi chú:", err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void fetchCurrentNotes();
    return () => {
      ignore = true;
    };
  }, [activeTopicId]);

  // Active topic object
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

  // Filtered & sorted notes
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeTab === "locked") {
      result = result.filter((n) => n.isLocked);
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
  }, [notes, searchQuery, sortOption, activeTab]);

  const totalNotesCount = useMemo(() => {
    return topics.reduce((sum, t) => sum + t.count, 0);
  }, [topics]);
  const handleSelectTopic = (id: string) => {
    if (id === activeTopicId) return;
    setIsLoading(true);
    setActiveTopicId(id);
  };

  // Handlers invoking MSW API endpoints
  const handleAddNote = async (newNoteData: {
    title: string;
    tag: string;
    topicId: string;
    isLocked: boolean;
    excerpt: string;
  }) => {
    const created = await createNote(newNoteData);
    setNotes((prev) => [created, ...prev]);
    setTopics((prev) =>
      prev.map((t) =>
        t.id === created.topicId ? { ...t, count: t.count + 1 } : t,
      ),
    );
  };

  const handleAddTopic = async (name: string) => {
    const created = await createTopic(name);
    setTopics((prev) => [...prev, created]);
    setActiveTopicId(created.id);
  };

  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  // Bấm "Xóa" ở menu -> chỉ MỞ dialog xác nhận, chưa xóa gì cả
  const requestDeleteNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target) setNoteToDelete(target);
  };

  // Bấm "Xóa" trong dialog -> lúc này mới thật sự gọi API xóa
  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    const id = noteToDelete.id;

    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setTopics((prev) =>
      prev.map((t) =>
        t.id === noteToDelete.topicId
          ? { ...t, count: Math.max(0, t.count - 1) }
          : t,
      ),
    );
    setNoteToDelete(null); // đóng dialog sau khi xóa xong
  };

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const handleViewNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target) setSelectedNote(target);
  };

  const handleToggleLock = async (id: string) => {
    const updated = await toggleNoteLock(id);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isLocked: updated.isLocked } : n)),
    );
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="bg-background text-foreground selection:bg-primary/20 selection:text-primary flex min-h-screen w-full antialiased">
        {/* Shadcn UI Sidebar */}
        <AppSidebar
          topics={topics}
          activeTopicId={activeTopicId}
          onSelectTopic={handleSelectTopic}
          onNewTopicClick={() => setIsNewTopicOpen(true)}
        />

        {/* Shadcn UI Sidebar Inset */}
        <SidebarInset className="bg-background flex min-w-0 flex-1 flex-col">
          {/* Top Sticky Header */}
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isDark={isDark}
            onToggleTheme={() => setIsDark((prev) => !prev)}
          />

          {/* Scrollable Page Body */}
          <main className="bg-background w-full flex-1 px-4 md:px-8 pt-3 md:pt-6 pb-28 md:pb-8">
            <div className="flex w-full flex-col">
              <div className="mx-auto flex w-full max-w-[420px] md:max-w-290 flex-col gap-3 md:gap-6">
                {/* Mobile Dynamic Filter Pill Bar */}
                <TopicFilterPills
                  topics={topics}
                  activeTopicId={activeTopicId}
                  totalCount={totalNotesCount}
                  onSelectTopic={handleSelectTopic}
                  className="md:hidden"
                />

                {/* Top Action & Context Header (Desktop) */}
                <div className="border-border hidden md:flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-end">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
                        {activeTopicId ? activeTopic.name : "Tất cả ghi chú"}
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
                      onSortChange={setSortOption}
                    />
                    <ViewModeSwitcher
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                    />
                    <Button
                      type="button"
                      onClick={() => setIsNewNoteOpen(true)}
                      className="flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-medium shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                      <Plus className="size-4" />
                      <span>Ghi chú mới</span>
                    </Button>
                  </div>
                </div>

                {/* Mobile Compact Controls Bar */}
                <div className="flex items-center justify-between gap-2 md:hidden">
                  <span className="text-muted-foreground truncate text-xs font-medium">
                    {activeTopicId ? activeTopic.name : "Tất cả"} ({filteredNotes.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <SortDropdown
                      sortOption={sortOption}
                      onSortChange={setSortOption}
                    />
                    <ViewModeSwitcher
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
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
                        onClick={() => setSearchQuery("")}
                        className="text-primary border-primary/30"
                      >
                        Xóa tìm kiếm
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => setIsNewNoteOpen(true)}
                        className="h-8 text-xs"
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
                        onDelete={requestDeleteNote}
                        onToggleLock={handleToggleLock}
                        onView={handleViewNote}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </SidebarInset>

        {/* New Note Dialog */}
        <NewNoteDialog
          open={isNewNoteOpen}
          onOpenChange={setIsNewNoteOpen}
          activeTopicId={activeTopicId}
          onAddNote={handleAddNote}
        />

        <ConfirmDeleteDialog
          open={noteToDelete !== null}
          noteTitle={noteToDelete?.title}
          onOpenChange={(open) => {
            if (!open) setNoteToDelete(null);
          }}
          onConfirm={confirmDeleteNote}
        />

        <NoteDetailDialog
          open={selectedNote !== null}
          note={selectedNote}
          onOpenChange={(open) => {
            if (!open) setSelectedNote(null);
          }}
        />

        {/* New Topic Dialog */}
        <NewTopicDialog
          open={isNewTopicOpen}
          onOpenChange={setIsNewTopicOpen}
          onAddTopic={handleAddTopic}
        />

        {/* Floating Action Button (FAB) for Mobile */}
        <div className="fixed right-4 bottom-20 z-40 md:hidden">
          <Button
            type="button"
            onClick={() => setIsNewNoteOpen(true)}
            aria-label="Tạo ghi chú mới"
            className="bg-primary text-primary-foreground shadow-primary/25 flex size-14 cursor-pointer items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-90"
          >
            <Plus className="size-6" />
          </Button>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSelectTopic={handleSelectTopic}
        />
      </div>
    </SidebarProvider>
  );
}
