import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Plus } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { NoteEditorPage } from "@/components/editor/NoteEditorPage";
import { NewNoteDialog } from "@/components/dashboard/NewNoteDialog";
import { NewTopicDialog } from "@/components/dashboard/NewTopicDialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDelete";
import { Button } from "@/components/ui/button";
import {
  MobileBottomNav,
  type MobileTab,
} from "@/components/dashboard/MobileBottomNav";
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
  const navigate = useNavigate();
  const location = useLocation();

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
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  // Derive activeTopicId from URL pathname
  let activeTopicId = "hoc-tap";
  if (location.pathname.startsWith("/topics/")) {
    activeTopicId = location.pathname.slice("/topics/".length) || "hoc-tap";
  } else if (location.pathname === "/locked") {
    activeTopicId = "locked";
  }

  // Derive mobile tab from pathname
  let activeTab: MobileTab = "notes";
  if (location.pathname === "/locked") {
    activeTab = "locked";
  } else if (location.pathname.startsWith("/topics/")) {
    activeTab = "topics";
  }

  // Load initial topics and metrics from MSW API
  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [fetchedTopics, fetchedMetrics] = await Promise.all([
          fetchTopics(),
          fetchMetrics(),
        ]);
        if (!ignore) {
          setTopics(fetchedTopics);
          setMetrics(fetchedMetrics);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    }
    void init();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch notes when active topic changes
  useEffect(() => {
    let ignore = false;
    async function loadNotes() {
      setIsLoading(true);
      try {
        const topicParam =
          activeTopicId === "locked" ? undefined : activeTopicId;
        const fetchedNotes = await fetchNotes(topicParam);
        if (!ignore) {
          setNotes(fetchedNotes);
        }
      } catch (err) {
        console.error("Failed to fetch notes", err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    void loadNotes();
    return () => {
      ignore = true;
    };
  }, [activeTopicId]);

  const handleSelectTopic = (id: string) => {
    if (id) {
      void navigate(`/topics/${id}`);
    } else {
      void navigate("/");
    }
  };

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
    void navigate(`/notes/${created.id}`);
  };

  const handleSaveNote = (updated: {
    id: string;
    title: string;
    excerpt: string;
    content?: string;
  }) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === updated.id
          ? { ...n, title: updated.title, excerpt: updated.excerpt }
          : n,
      ),
    );
  };

  const handleAddTopic = async (name: string) => {
    const created = await createTopic(name);
    setTopics((prev) => [...prev, created]);
    void navigate(`/topics/${created.id}`);
  };

  const requestDeleteNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target) setNoteToDelete(target);
  };

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
    setNoteToDelete(null);
  };

  const handleToggleLock = async (id: string) => {
    const updated = await toggleNoteLock(id);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isLocked: updated.isLocked } : n)),
    );
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="bg-background text-foreground flex min-h-screen w-full antialiased">
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

          {/* Router Outlet / Routes */}
          <Routes>
            <Route
              path="/notes/:noteId"
              element={
                <NoteEditorPage
                  notes={notes}
                  topics={topics}
                  isLoading={isLoading}
                  onSave={handleSaveNote}
                  onDelete={requestDeleteNote}
                  onToggleLock={handleToggleLock}
                />
              }
            />

            <Route
              path="/topics/:topicId"
              element={
                <DashboardPage
                  notes={notes}
                  topics={topics}
                  metrics={metrics}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery("")}
                  sortOption={sortOption}
                  onSortChange={setSortOption}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onOpenNewNote={() => setIsNewNoteOpen(true)}
                  onDeleteNote={requestDeleteNote}
                  onToggleLock={handleToggleLock}
                />
              }
            />

            <Route
              path="/locked"
              element={
                <DashboardPage
                  notes={notes}
                  topics={topics}
                  metrics={metrics}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery("")}
                  sortOption={sortOption}
                  onSortChange={setSortOption}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onOpenNewNote={() => setIsNewNoteOpen(true)}
                  onDeleteNote={requestDeleteNote}
                  onToggleLock={handleToggleLock}
                />
              }
            />

            <Route
              path="/"
              element={
                <DashboardPage
                  notes={notes}
                  topics={topics}
                  metrics={metrics}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery("")}
                  sortOption={sortOption}
                  onSortChange={setSortOption}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onOpenNewNote={() => setIsNewNoteOpen(true)}
                  onDeleteNote={requestDeleteNote}
                  onToggleLock={handleToggleLock}
                />
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SidebarInset>

        {/* New Note Dialog */}
        <NewNoteDialog
          open={isNewNoteOpen}
          onOpenChange={setIsNewNoteOpen}
          activeTopicId={activeTopicId === "locked" ? "hoc-tap" : activeTopicId}
          onAddNote={handleAddNote}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDeleteDialog
          open={noteToDelete !== null}
          noteTitle={noteToDelete?.title}
          onOpenChange={(open) => {
            if (!open) setNoteToDelete(null);
          }}
          onConfirm={confirmDeleteNote}
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
            size="icon-lg"
            className="size-14 cursor-pointer rounded-full shadow-lg"
            aria-label="Tạo ghi chú mới"
          >
            <Plus className="size-6" />
          </Button>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === "locked") {
              void navigate("/locked");
            } else if (tab === "notes") {
              void navigate("/");
            }
          }}
          onSelectTopic={handleSelectTopic}
        />
      </div>
    </SidebarProvider>
  );
}
