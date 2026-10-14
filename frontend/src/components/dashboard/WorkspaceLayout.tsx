import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveRouteIds } from "@/hooks/useActiveRouteIds";
import { useShallow } from "zustand/react/shallow";
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
import { useAuthStore } from "@/stores/useAuthStore";
import { fetchUserProfile } from "@/services/auth";
import type { Note, Topic } from "@/types/note";

export function WorkspaceLayout() {
  const navigate = useNavigate();

  // Workspace Store
  const { notes, topics, fetchWorkspaceData, ensureNoteLoaded } = useWorkspaceStore(
    useShallow((s) => ({
      notes: s.notes,
      topics: s.topics,
      fetchWorkspaceData: s.fetchWorkspaceData,
      ensureNoteLoaded: s.ensureNoteLoaded,
    })),
  );
  const { activeTopicId, activeNoteId } = useActiveRouteIds();

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
    <SidebarProvider defaultOpen={true} className="h-svh max-h-svh overflow-hidden">
      <WorkspaceLayoutContent currentNote={currentNote} currentTopic={currentTopic} />
    </SidebarProvider>
  );
}

interface WorkspaceLayoutContentProps {
  currentNote: Note | undefined;
  currentTopic: Topic | undefined;
}

function WorkspaceLayoutContent({ currentNote, currentTopic }: WorkspaceLayoutContentProps) {
  const navigate = useNavigate();

  // Auth Store
  const { currentUser, setCurrentUser } = useAuthStore(
    useShallow((s) => ({
      currentUser: s.currentUser,
      setCurrentUser: s.setCurrentUser,
    })),
  );
  // Workspace Store (reactive state & actions via useShallow)
  const { createTopic, deleteNote, toggleNoteLock } = useWorkspaceStore(
    useShallow((s) => ({
      createTopic: s.createTopic,
      deleteNote: s.deleteNote,
      toggleNoteLock: s.toggleNoteLock,
    })),
  );

  // UI Store (reactive state & actions via useShallow)
  const {
    isNewTopicOpen,
    isPinSettingsOpen,
    lockTargetNote,
    noteToDelete,
    setNewTopicOpen,
    setPinSettingsOpen,
    closeDeleteDialog,
    closeLockDialog,
  } = useUIStore(
    useShallow((s) => ({
      isNewTopicOpen: s.isNewTopicOpen,
      isPinSettingsOpen: s.isPinSettingsOpen,
      lockTargetNote: s.lockTargetNote,
      noteToDelete: s.noteToDelete,
      setNewTopicOpen: s.setNewTopicOpen,
      setPinSettingsOpen: s.setPinSettingsOpen,
      closeDeleteDialog: s.closeDeleteDialog,
      closeLockDialog: s.closeLockDialog,
    })),
  );
  return (
    <div className="bg-background text-foreground flex h-svh max-h-svh w-full overflow-hidden antialiased">
      <AppSidebar />

      <SidebarInset className="bg-background flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <TopNav currentNote={currentNote} currentTopic={currentTopic} />

        <main className="flex min-h-0 flex-1 overflow-y-auto">
          <DocumentCanvas note={currentNote} />
        </main>
      </SidebarInset>

      {/* Global Dialogs & Modals */}
      <SearchModal />

      <NewTopicDialog
        open={isNewTopicOpen}
        onOpenChange={setNewTopicOpen}
        onAddTopic={async (name: string) => {
          await createTopic(name);
          setNewTopicOpen(false);
        }}
      />

      <PinSettingsDialog
        key={isPinSettingsOpen ? "pin-settings-open" : "pin-settings-closed"}
        open={isPinSettingsOpen}
        onOpenChange={setPinSettingsOpen}
        hasExistingPin={Boolean(currentUser?.hasPrivatePin)}
        onPinUpdated={async () => {
          try {
            const profile = await fetchUserProfile();
            setCurrentUser(profile);
          } catch {
            if (currentUser) {
              setCurrentUser({ ...currentUser, hasPrivatePin: true });
            }
          }
          // Khóa lại toàn bộ phiên giải mã và làm mới dữ liệu
          await useWorkspaceStore.getState().lockVault();
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
        key={lockTargetNote ? `${lockTargetNote.id}-${lockTargetNote.mode}` : "lock-dialog-closed"}
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
  );
}
