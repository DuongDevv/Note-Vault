import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { NotionTopNav } from "@/components/dashboard/NotionTopNav";
import { NotionDocumentCanvas } from "@/components/dashboard/NotionDocumentCanvas";
import { NotionSearchModal } from "@/components/dashboard/NotionSearchModal";
import { NewTopicDialog } from "@/components/dashboard/NewTopicDialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDelete";
import { PinSettingsDialog } from "@/components/dashboard/PinSettingsDialog";
import {
  fetchTopics,
  fetchNotes,
  fetchNoteById,
  createTopic,
  createNote,
  deleteNote,
  deleteTopic,
  updateNote,
  toggleNoteLock,
} from "@/services/api";
import type { AuthUser } from "@/services/auth";
import type { Note, Topic } from "@/types/note";

interface WorkspaceLayoutProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onUserUpdate: (user: AuthUser) => void;
}

export function WorkspaceLayout({
  currentUser,
  onLogout,
  isDark,
  onToggleTheme,
  onUserUpdate,
}: WorkspaceLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Workspace Data State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>(undefined);

  // Dialogs State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const [isPinSettingsOpen, setIsPinSettingsOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  // Derive Active Topic & Note from current URL
  const activeTopicId = useMemo(() => {
    const match = /^\/topics\/([^/]+)/.exec(location.pathname);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  const activeNoteId = useMemo(() => {
    const match = /^\/notes\/([^/]+)/.exec(location.pathname);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  // Load Initial Topics & Notes
  useEffect(() => {
    let ignore = false;
    async function loadWorkspaceData() {
      setIsLoading(true);
      try {
        const [fetchedTopics, fetchedNotes] = await Promise.all([
          fetchTopics(),
          fetchNotes(),
        ]);
        if (!ignore) {
          setTopics(fetchedTopics);
          setNotes(fetchedNotes);
        }
      } catch (err) {
        console.error("Failed to load workspace data:", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    void loadWorkspaceData();
    return () => {
      ignore = true;
    };
  }, []);

  // Sync route selection if directly hitting a note URL
  useEffect(() => {
    let ignore = false;
    if (activeNoteId && !isLoading) {
      const existing = notes.find((n) => n.id === activeNoteId);
      if (!existing) {
        void fetchNoteById(activeNoteId)
          .then((single) => {
            if (!ignore) {
              setNotes((prev) => [
                single,
                ...prev.filter((n) => n.id !== single.id),
              ]);
            }
          })
          .catch(() => {
            if (!ignore) void navigate("/", { replace: true });
          });
      }
    }
    return () => {
      ignore = true;
    };
  }, [activeNoteId, notes, isLoading, navigate]);

  // Current active note & topic
  const currentNote = useMemo(() => {
    if (!activeNoteId) return undefined;
    return notes.find((n) => n.id === activeNoteId);
  }, [notes, activeNoteId]);

  const currentTopic = useMemo(() => {
    if (currentNote?.topicId) {
      return topics.find((t) => t.id === currentNote.topicId);
    }
    if (activeTopicId) {
      return topics.find((t) => t.id === activeTopicId);
    }
    return undefined;
  }, [topics, currentNote, activeTopicId]);

  // Navigation handlers
  const handleSelectNote = useCallback(
    (noteId: string) => {
      void navigate(`/notes/${noteId}`);
    },
    [navigate],
  );

  const handleSelectTopic = useCallback(
    (topicId: string) => {
      if (topicId) {
        void navigate(`/topics/${topicId}`);
      } else {
        void navigate("/");
      }
    },
    [navigate],
  );

  // Create new Note
  const handleNewNote = async (topicId?: string) => {
    try {
      const created = await createNote({
        title: "Trang chưa có tiêu đề",
        content: JSON.stringify({
          type: "doc",
          content: [{ type: "paragraph" }],
        }),
        topicId: topicId ?? activeTopicId,
        tags: [],
        isPinned: false,
        isLocked: false,
      });
      setNotes((prev) => [created, ...prev]);
      void navigate(`/notes/${created.id}`);
    } catch (err) {
      console.error("Failed to create note", err);
    }
  };

  // Save / Update Note
  const handleSaveNote = async (updated: {
    id: string;
    title: string;
    excerpt: string;
    content?: string;
  }) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)),
    );
    try {
      await updateNote(updated.id, {
        title: updated.title,
        content: updated.content ?? "",
        tags: [],
      });
      setLastSavedAt(new Date());
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  // Add Topic
  const handleAddTopic = async (name: string, icon?: string) => {
    try {
      const created = await createTopic(name, icon ?? "folder");
      setTopics((prev) => [...prev, created]);
      setIsNewTopicOpen(false);
    } catch (err) {
      console.error("Failed to create topic", err);
    }
  };

  // Toggle Note PIN Lock
  const handleToggleLock = async (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    const newLockState = !target.isLocked;
    try {
      await toggleNoteLock(noteId, target.isLocked);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, isLocked: newLockState } : n,
        ),
      );
    } catch (err) {
      console.error("Failed to toggle note lock", err);
    }
  };

  // Unlock Note with PIN
  const handleUnlockWithPin = async (noteId: string, pin: string) => {
    try {
      const unlocked = await fetchNoteById(noteId, pin);
      setNotes((prev) => prev.map((n) => (n.id === noteId ? unlocked : n)));
      return true;
    } catch {
      return false;
    }
  };

  // Delete Note
  const requestDeleteNote = (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (target) setNoteToDelete(target);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    try {
      await deleteNote(noteToDelete.id);
      const remaining = notes.filter((n) => n.id !== noteToDelete.id);
      setNotes(remaining);
      setNoteToDelete(null);
      if (remaining.length > 0 && remaining[0]?.id) {
        void navigate(`/notes/${remaining[0].id}`);
      } else {
        void navigate("/");
      }
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  // Delete Topic (Cascade delete child notes)
  const handleDeleteTopic = async (topicId: string) => {
    try {
      await deleteTopic(topicId);
      setTopics((prev) => prev.filter((t) => t.id !== topicId));
      const remainingNotes = notes.filter((n) => n.topicId !== topicId);
      setNotes(remainingNotes);
      if (currentNote?.topicId === topicId) {
        if (remainingNotes.length > 0 && remainingNotes[0]?.id) {
          void navigate(`/notes/${remainingNotes[0].id}`);
        } else {
          void navigate("/");
        }
      }
    } catch (err) {
      console.error("Failed to delete topic", err);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="bg-background text-foreground flex min-h-screen w-full antialiased">
        {/* Notion Hierarchy AppSidebar */}
        <AppSidebar
          notes={notes}
          topics={topics}
          activeNoteId={activeNoteId}
          activeTopicId={activeTopicId}
          onSelectNote={handleSelectNote}
          onSelectTopic={handleSelectTopic}
          onNewNoteClick={handleNewNote}
          onNewTopicClick={() => setIsNewTopicOpen(true)}
          onSearchClick={() => setIsSearchOpen(true)}
          currentUser={currentUser}
          onLogout={onLogout}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onOpenPinSettings={() => setIsPinSettingsOpen(true)}
          onToggleLock={handleToggleLock}
          onDeleteNote={requestDeleteNote}
          onDeleteTopic={handleDeleteTopic}
        />

        {/* Main Notion Canvas Area */}
        <SidebarInset className="bg-background flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Minimalist Notion Top Nav */}
          <NotionTopNav
            currentNote={currentNote}
            currentTopic={currentTopic}
            isSaving={isSaving}
            lastSavedAt={lastSavedAt}
            onToggleLock={handleToggleLock}
            onDeleteNote={requestDeleteNote}
            onNavigateTopic={handleSelectTopic}
          />

          {/* Document-First Tiptap Canvas */}
          <main className="flex flex-1 overflow-y-auto">
            <NotionDocumentCanvas
              note={currentNote}
              topics={topics}
              isLoading={isLoading}
              onSaveNote={handleSaveNote}
              onNewNote={() => void handleNewNote()}
              onSavingStatusChange={setIsSaving}
              onUnlockWithPin={handleUnlockWithPin}
            />
          </main>
        </SidebarInset>

        {/* Quick Search Modal (⌘K) */}
        <NotionSearchModal
          open={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          notes={notes}
          topics={topics}
          onSelectNote={handleSelectNote}
          onSelectTopic={handleSelectTopic}
        />

        {/* Dialogs */}
        <NewTopicDialog
          open={isNewTopicOpen}
          onOpenChange={setIsNewTopicOpen}
          onAddTopic={handleAddTopic}
        />

        <PinSettingsDialog
          open={isPinSettingsOpen}
          onOpenChange={setIsPinSettingsOpen}
          hasExistingPin={Boolean(currentUser?.hasPrivatePin)}
          onPinUpdated={() => {
            if (currentUser) {
              onUserUpdate({ ...currentUser, hasPrivatePin: true });
            }
          }}
        />

        <ConfirmDeleteDialog
          open={Boolean(noteToDelete)}
          onOpenChange={(open) => {
            if (!open) setNoteToDelete(null);
          }}
          noteTitle={noteToDelete?.title ?? ""}
          onConfirm={confirmDeleteNote}
        />
      </div>
    </SidebarProvider>
  );
}
