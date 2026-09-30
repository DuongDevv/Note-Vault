import { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { DocumentCanvas } from "@/components/dashboard/DocumentCanvas";
import { SearchModal } from "@/components/dashboard/SearchModal";
import { NewTopicDialog } from "@/components/dashboard/NewTopicDialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDelete";
import { PinSettingsDialog } from "@/components/dashboard/PinSettingsDialog";
import { LockPinDialog } from "@/components/dashboard/LockPinDialog";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useUIStore } from "@/stores/useUIStore";
import { fetchUserProfile, type AuthUser } from "@/services/auth";

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

  // Workspace Store
  const notes = useWorkspaceStore((s) => s.notes);
  const topics = useWorkspaceStore((s) => s.topics);
  const fetchWorkspaceData = useWorkspaceStore((s) => s.fetchWorkspaceData);
  const ensureNoteLoaded = useWorkspaceStore((s) => s.ensureNoteLoaded);
  const createTopic = useWorkspaceStore((s) => s.createTopic);
  const deleteNote = useWorkspaceStore((s) => s.deleteNote);
  const toggleNoteLock = useWorkspaceStore((s) => s.toggleNoteLock);

  // UI Store
  const isSearchOpen = useUIStore((s) => s.isSearchOpen);
  const searchInitialQuery = useUIStore((s) => s.searchInitialQuery);
  const isNewTopicOpen = useUIStore((s) => s.isNewTopicOpen);
  const isPinSettingsOpen = useUIStore((s) => s.isPinSettingsOpen);
  const lockTargetNote = useUIStore((s) => s.lockTargetNote);
  const noteToDelete = useUIStore((s) => s.noteToDelete);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const setNewTopicOpen = useUIStore((s) => s.setNewTopicOpen);
  const setPinSettingsOpen = useUIStore((s) => s.setPinSettingsOpen);
  const closeDeleteDialog = useUIStore((s) => s.closeDeleteDialog);
  const closeLockDialog = useUIStore((s) => s.closeLockDialog);
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
    void fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // Sync route selection if directly hitting a note URL
  useEffect(() => {
    if (activeNoteId) {
      void ensureNoteLoaded(activeNoteId).then((loadedNote) => {
        if (!loadedNote) {
          void navigate("/", { replace: true });
        }
      });
    }
  }, [activeNoteId, ensureNoteLoaded, navigate]);

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

  return (
    <SidebarProvider
      defaultOpen={true}
      className="h-svh max-h-svh overflow-hidden"
    >
      <div className="bg-background text-foreground flex h-svh max-h-svh w-full overflow-hidden antialiased">
        <AppSidebar
          currentUser={currentUser}
          onLogout={onLogout}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
        />

        <SidebarInset className="bg-background flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <TopNav
            currentNote={currentNote}
            currentTopic={currentTopic}
            hasPrivatePin={currentUser?.hasPrivatePin}
          />

          <main className="flex min-h-0 flex-1 overflow-y-auto">
            <DocumentCanvas note={currentNote} />
          </main>
        </SidebarInset>

        {/* Global Dialogs & Modals */}
        <SearchModal
          open={isSearchOpen}
          onOpenChange={setSearchOpen}
          initialQuery={searchInitialQuery}
          notes={notes}
          topics={topics}
          onSelectNote={(id) => void navigate(`/notes/${id}`)}
          onSelectTopic={(id) => void navigate(id ? `/topics/${id}` : "/")}
        />

        <NewTopicDialog
          open={isNewTopicOpen}
          onOpenChange={setNewTopicOpen}
          onAddTopic={async (name: string) => {
            await createTopic(name);
            setNewTopicOpen(false);
          }}
        />

        <PinSettingsDialog
          open={isPinSettingsOpen}
          onOpenChange={setPinSettingsOpen}
          hasExistingPin={Boolean(currentUser?.hasPrivatePin)}
          onPinUpdated={async () => {
            try {
              const profile = await fetchUserProfile();
              onUserUpdate(profile);
            } catch {
              if (currentUser) {
                onUserUpdate({ ...currentUser, hasPrivatePin: true });
              }
            }
            // Khóa lại toàn bộ phiên giải mã và làm mới dữ liệu
            useWorkspaceStore.getState().setUnlockedNoteId(null);
            void useWorkspaceStore.getState().fetchWorkspaceData();
          }}
        />

        <ConfirmDeleteDialog
          open={Boolean(noteToDelete)}
          onOpenChange={(open) => {
            if (!open) closeDeleteDialog();
          }}
          noteTitle={noteToDelete?.title ?? ""}
          onConfirm={async () => {
            if (!noteToDelete) return;
            const remainingId = await deleteNote(noteToDelete.id);
            closeDeleteDialog();
            if (remainingId) {
              void navigate(`/notes/${remainingId}`);
            } else {
              void navigate("/");
            }
          }}
        />

        <LockPinDialog
          open={Boolean(lockTargetNote)}
          onOpenChange={(open) => {
            if (!open) closeLockDialog();
          }}
          mode={lockTargetNote?.mode ?? "lock"}
          noteTitle={lockTargetNote?.title}
          onConfirm={async (pin) => {
            if (!lockTargetNote) return;
            await toggleNoteLock(lockTargetNote.id, pin);
            closeLockDialog();
          }}
        />
      </div>
    </SidebarProvider>
  );
}
