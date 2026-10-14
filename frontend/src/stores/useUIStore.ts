import { create } from "zustand";
import type { Note } from "@/types/note";

export interface LockTarget {
  id: string;
  mode: "lock" | "unlock";
  title: string;
}

interface UIState {
  isDark: boolean;
  isSearchOpen: boolean;
  searchInitialQuery: string;
  isNewTopicOpen: boolean;
  isPinSettingsOpen: boolean;
  lockTargetNote: LockTarget | null;
  noteToDelete: Note | null;

  toggleTheme: () => void;
  setSearchOpen: (open: boolean, initialQuery?: string) => void;
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

function getInitialTheme(): boolean {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem("notevault-theme");
  const isDark = saved
    ? saved === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", isDark);
  return isDark;
}

export const useUIStore = create<UIState>((set) => ({
  isDark: getInitialTheme(),
  isSearchOpen: false,
  searchInitialQuery: "",
  isNewTopicOpen: false,
  isPinSettingsOpen: false,
  lockTargetNote: null,
  noteToDelete: null,

  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark;
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next);
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("notevault-theme", next ? "dark" : "light");
      }
      return { isDark: next };
    }),
  setSearchOpen: (open, initialQuery = "") =>
    set({ isSearchOpen: open, searchInitialQuery: initialQuery }),
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
