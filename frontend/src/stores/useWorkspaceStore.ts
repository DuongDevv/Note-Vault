import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
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
  toggleNotePin as apiToggleNotePin,
} from "@/services/api";
import { verifyPrivatePin, lockVaultSession } from "@/services/auth";

interface WorkspaceState {
  notes: Note[];
  topics: Topic[];
  isLoading: boolean;
  isSaving: boolean;
  isNoteLoading: boolean;
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
    tags?: string[];
  }) => Promise<void>;
  createTopic: (name: string, icon?: string) => Promise<Topic>;
  updateTopic: (id: string, name: string) => Promise<Topic>;
  moveNoteToTopic: (noteId: string, topicId: string | null) => Promise<void>;
  deleteNote: (noteId: string) => Promise<string | undefined>;
  deleteTopic: (topicId: string, currentNoteTopicId?: string | null) => Promise<string | undefined>;
  toggleNoteLock: (noteId: string, pin: string) => Promise<void>;
  toggleNotePin: (noteId: string) => Promise<void>;
  unlockNoteWithPin: (noteId: string, pin: string) => Promise<boolean>;
  lockVault: () => Promise<void>;
  setSavingStatus: (isSaving: boolean) => void;
  setUnlockedNoteId: (noteId: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  immer((set, get) => ({
    notes: [],
    topics: [],
    isLoading: true,
    isSaving: false,
    isNoteLoading: false,
    lastSavedAt: undefined,
    unlockedNoteId: null,

    fetchWorkspaceData: async () => {
      set({ isLoading: true });
      try {
        const [fetchedTopics, fetchedNotes] = await Promise.all([fetchTopics(), fetchNotes()]);
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
      // Nếu note đã có content (không phải undefined và nếu có dữ liệu đã được fetch)
      if (existing?.content !== undefined && existing.content !== null) {
        return existing;
      }

      set({ isNoteLoading: true });
      try {
        const single = await fetchNoteById(noteId);
        set((state) => {
          const index = state.notes.findIndex((n) => n.id === single.id);
          if (index !== -1) {
            Object.assign(state.notes[index], single);
          } else {
            state.notes.unshift(single);
          }
          state.isNoteLoading = false;
        });
        return single;
      } catch (err) {
        console.error("Failed to fetch note by id:", err);
        set({ isNoteLoading: false });
        return existing;
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

      set((state) => {
        state.notes.unshift(created);
      });
      return created;
    },

    updateNoteContent: async (updated) => {
      set((state) => {
        const note = state.notes.find((n) => n.id === updated.id);
        if (note) {
          note.title = updated.title;
          note.excerpt = updated.excerpt;
          if (updated.content !== undefined) {
            note.content = updated.content;
          }
          if (updated.tags !== undefined) {
            note.tags = updated.tags;
          }
        }
      });

      try {
        await apiUpdateNote(updated.id, {
          title: updated.title,
          excerpt: updated.excerpt,
          content: updated.content ?? "",
          tags: updated.tags,
        });
        set({ lastSavedAt: new Date() });
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    },

    createTopic: async (name: string, icon?: string) => {
      const created = await apiCreateTopic(name, icon ?? "folder");
      set((state) => {
        state.topics.push(created);
      });
      return created;
    },

    updateTopic: async (id: string, name: string) => {
      const updated = await apiUpdateTopic(id, { name });
      set((state) => {
        const topic = state.topics.find((t) => t.id === id);
        if (topic) {
          Object.assign(topic, updated);
        }
      });
      return updated;
    },

    moveNoteToTopic: async (noteId: string, topicId: string | null) => {
      await apiUpdateNote(noteId, { topicId });
      set((state) => {
        const note = state.notes.find((n) => n.id === noteId);
        if (note) {
          note.topicId = topicId;
        }
      });
    },

    deleteNote: async (noteId: string) => {
      await apiDeleteNote(noteId);
      let nextNoteId: string | undefined;
      set((state) => {
        const index = state.notes.findIndex((n) => n.id === noteId);
        if (index !== -1) {
          state.notes.splice(index, 1);
        }
        nextNoteId = state.notes[0]?.id;
      });
      return nextNoteId;
    },

    deleteTopic: async (topicId: string, currentNoteTopicId?: string | null) => {
      await apiDeleteTopic(topicId);
      let nextNoteId: string | undefined;
      set((state) => {
        state.topics = state.topics.filter((t) => t.id !== topicId);
        state.notes = state.notes.filter((n) => n.topicId !== topicId);
        if (currentNoteTopicId === topicId) {
          nextNoteId = state.notes[0]?.id;
        }
      });
      return nextNoteId;
    },

    toggleNoteLock: async (noteId: string, pin: string) => {
      const target = get().notes.find((n) => n.id === noteId);
      if (!target) return;

      const newLockState = !target.isLocked;
      const updated = await apiToggleNoteLock(noteId, target.isLocked, pin);

      set((state) => {
        const note = state.notes.find((n) => n.id === noteId);
        if (note) {
          note.isLocked = newLockState;
          note.content = newLockState ? null : (updated.content ?? note.content);
        }
      });
    },

    unlockNoteWithPin: async (noteId: string, pin: string) => {
      // 1. Verify PIN and obtain Redis-backed Vault Session Token (15m TTL)
      const verification = await verifyPrivatePin(pin);
      if (!verification.verified) {
        throw new Error("Mã PIN không chính xác");
      }

      // 2. Fetch note using the newly established vault session token (fallback with pin)
      const unlocked = await fetchNoteById(noteId, pin, verification.vaultToken);
      if (unlocked.isLocked && unlocked.content === null) {
        throw new Error("Không thể giải mã nội dung với mã PIN này");
      }
      set((state) => {
        const index = state.notes.findIndex((n) => n.id === noteId);
        if (index !== -1) {
          state.notes[index] = unlocked;
        }
        state.unlockedNoteId = noteId;
      });
      return true;
    },

    lockVault: async () => {
      await lockVaultSession();
      set((state) => {
        state.unlockedNoteId = null;
        for (const note of state.notes) {
          if (note.isLocked) {
            note.content = null;
          }
        }
      });
    },

    toggleNotePin: async (noteId: string) => {
      // Optimistic update
      set((state) => {
        const note = state.notes.find((n) => n.id === noteId);
        if (note) {
          note.isPinned = !note.isPinned;
        }
      });
      try {
        const updated = await apiToggleNotePin(noteId);
        set((state) => {
          const index = state.notes.findIndex((n) => n.id === noteId);
          if (index !== -1) {
            state.notes[index] = updated;
          }
        });
      } catch (err) {
        // Rollback on error
        set((state) => {
          const note = state.notes.find((n) => n.id === noteId);
          if (note) {
            note.isPinned = !note.isPinned;
          }
        });
        throw err;
      }
    },

    setSavingStatus: (isSaving) => set({ isSaving }),
    setUnlockedNoteId: (unlockedNoteId) => set({ unlockedNoteId }),
  })),
);
