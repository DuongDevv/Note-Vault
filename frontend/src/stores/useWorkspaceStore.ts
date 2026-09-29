import { create } from "zustand";
import type { Note, Topic } from "@/types/note";
import {
  fetchTopics,
  fetchNotes,
  fetchNoteById,
  createTopic as apiCreateTopic,
  updateTopic as apiUpdateTopic,
  createNote as apiCreateNote,
  deleteNote as apiDeleteNote,
  deleteTopic as apiDeleteTopic,
  updateNote as apiUpdateNote,
  toggleNoteLock as apiToggleNoteLock,
} from "@/services/api";
interface WorkspaceState {
  notes: Note[];
  topics: Topic[];
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: Date | undefined;
  unlockedNoteId: string | null;

  // Actions
  fetchWorkspaceData: () => Promise<void>;
  ensureNoteLoaded: (noteId: string) => Promise<Note | undefined>;
  createNote: (topicId?: string) => Promise<Note>;
  updateNoteContent: (updated: {
    id: string;
    title: string;
    excerpt: string;
    content?: string;
  }) => Promise<void>;
  createTopic: (name: string, icon?: string) => Promise<Topic>;
  updateTopic: (id: string, name: string) => Promise<Topic>;
  moveNoteToTopic: (noteId: string, topicId: string | null) => Promise<void>;
  deleteNote: (noteId: string) => Promise<string | undefined>;
  deleteTopic: (
    topicId: string,
    currentNoteTopicId?: string | null,
  ) => Promise<string | undefined>;
  toggleNoteLock: (noteId: string, pin: string) => Promise<void>;
  unlockNoteWithPin: (noteId: string, pin: string) => Promise<boolean>;
  setSavingStatus: (isSaving: boolean) => void;
  setUnlockedNoteId: (noteId: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  notes: [],
  topics: [],
  isLoading: true,
  isSaving: false,
  lastSavedAt: undefined,
  unlockedNoteId: null,

  fetchWorkspaceData: async () => {
    set({ isLoading: true });
    try {
      const [fetchedTopics, fetchedNotes] = await Promise.all([
        fetchTopics(),
        fetchNotes(),
      ]);
      set({
        topics: fetchedTopics,
        notes: fetchedNotes,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to load workspace data:", err);
      set({ isLoading: false });
    }
  },

  ensureNoteLoaded: async (noteId: string) => {
    const { notes } = get();
    const existing = notes.find((n) => n.id === noteId);
    if (existing) return existing;

    try {
      const single = await fetchNoteById(noteId);
      set((state) => ({
        notes: [single, ...state.notes.filter((n) => n.id !== single.id)],
      }));
      return single;
    } catch (err) {
      console.error("Failed to fetch note by id:", err);
      return undefined;
    }
  },

  createNote: async (topicId?: string) => {
    const created = await apiCreateNote({
      title: "Trang chưa có tiêu đề",
      content: JSON.stringify({
        type: "doc",
        content: [{ type: "paragraph" }],
      }),
      topicId: topicId ?? null,
      tags: [],
      isLocked: false,
    });

    set((state) => ({
      notes: [created, ...state.notes],
    }));
    return created;
  },

  updateNoteContent: async (updated) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === updated.id
          ? {
              ...n,
              title: updated.title,
              excerpt: updated.excerpt,
              content: updated.content ?? n.content,
            }
          : n,
      ),
    }));

    try {
      await apiUpdateNote(updated.id, {
        title: updated.title,
        excerpt: updated.excerpt,
        content: updated.content ?? "",
      });
      set({ lastSavedAt: new Date() });
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  },

  createTopic: async (name: string, icon?: string) => {
    const created = await apiCreateTopic(name, icon ?? "folder");
    set((state) => ({
      topics: [...state.topics, created],
    }));
    return created;
  },

  updateTopic: async (id: string, name: string) => {
    const updated = await apiUpdateTopic(id, { name });
    set((state) => ({
      topics: state.topics.map((t) => (t.id === id ? updated : t)),
    }));
    return updated;
  },

  moveNoteToTopic: async (noteId: string, topicId: string | null) => {
    await apiUpdateNote(noteId, { topicId });
    set((state) => ({
      notes: state.notes.map((n) => (n.id === noteId ? { ...n, topicId } : n)),
    }));
  },

  deleteNote: async (noteId: string) => {
    await apiDeleteNote(noteId);
    let nextNoteId: string | undefined;
    set((state) => {
      const remaining = state.notes.filter((n) => n.id !== noteId);
      nextNoteId = remaining[0]?.id;
      return { notes: remaining };
    });
    return nextNoteId;
  },

  deleteTopic: async (topicId: string, currentNoteTopicId?: string | null) => {
    await apiDeleteTopic(topicId);
    let nextNoteId: string | undefined;
    set((state) => {
      const remainingTopics = state.topics.filter((t) => t.id !== topicId);
      const remainingNotes = state.notes.filter((n) => n.topicId !== topicId);
      if (currentNoteTopicId === topicId) {
        nextNoteId = remainingNotes[0]?.id;
      }
      return {
        topics: remainingTopics,
        notes: remainingNotes,
      };
    });
    return nextNoteId;
  },

  toggleNoteLock: async (noteId: string, pin: string) => {
    const target = get().notes.find((n) => n.id === noteId);
    if (!target) return;

    const newLockState = !target.isLocked;
    const updated = await apiToggleNoteLock(noteId, target.isLocked, pin);

    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === noteId
          ? {
              ...n,
              isLocked: newLockState,
              content: newLockState ? null : (updated.content ?? n.content),
            }
          : n,
      ),
    }));
  },

  unlockNoteWithPin: async (noteId: string, pin: string) => {
    try {
      const unlocked = await fetchNoteById(noteId, pin);
      if (unlocked.isLocked && unlocked.content === null) {
        return false;
      }
      set((state) => ({
        notes: state.notes.map((n) => (n.id === noteId ? unlocked : n)),
        unlockedNoteId: noteId,
      }));
      return true;
    } catch {
      return false;
    }
  },

  setSavingStatus: (isSaving) => set({ isSaving }),
  setUnlockedNoteId: (unlockedNoteId) => set({ unlockedNoteId }),
}));
