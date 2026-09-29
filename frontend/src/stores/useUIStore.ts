import { create } from "zustand";
import type { Note } from "@/types/note";

export interface LockTarget {
  id: string;
  mode: "lock" | "unlock";
  title: string;
}

interface UIState {
  isSearchOpen: boolean;
  isNewTopicOpen: boolean;
  isPinSettingsOpen: boolean;
  lockTargetNote: LockTarget | null;
  noteToDelete: Note | null;

  setSearchOpen: (open: boolean) => void;
  setNewTopicOpen: (open: boolean) => void;
  setPinSettingsOpen: (open: boolean) => void;
  setLockTargetNote: (target: LockTarget | null) => void;
  requestLockToggle: (
    note: { id: string; isLocked: boolean; title: string },
    hasPrivatePin?: boolean,
  ) => void;
  setNoteToDelete: (note: Note | null) => void;
  closeDeleteDialog: () => void;
  closeLockDialog: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  isNewTopicOpen: false,
  isPinSettingsOpen: false,
  lockTargetNote: null,
  noteToDelete: null,

  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setNewTopicOpen: (open) => set({ isNewTopicOpen: open }),
  setPinSettingsOpen: (open) => set({ isPinSettingsOpen: open }),
  setLockTargetNote: (target) => set({ lockTargetNote: target }),

  requestLockToggle: (note, hasPrivatePin) => {
    if (!note.isLocked && !hasPrivatePin) {
      set({ isPinSettingsOpen: true });
      return;
    }
    set({
      lockTargetNote: {
        id: note.id,
        mode: note.isLocked ? "unlock" : "lock",
        title: note.title,
      },
    });
  },

  setNoteToDelete: (note) => set({ noteToDelete: note }),
  closeDeleteDialog: () => set({ noteToDelete: null }),
  closeLockDialog: () => set({ lockTargetNote: null }),
}));
