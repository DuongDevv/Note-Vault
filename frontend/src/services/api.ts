import type { Note, Topic } from "@/types/note";
import { api, type NoteResponseDto, type TopicResponseDto } from "./apiClient";

function normalizeNote(raw: NoteResponseDto): Note {
  const primaryTag = raw.tags.length > 0 ? (raw.tags[0] ?? "") : "";
  const formattedTag = primaryTag
    ? primaryTag.startsWith("#")
      ? primaryTag
      : `#${primaryTag}`
    : "";
  let excerpt = "";
  if (typeof raw.content === "string") {
    excerpt = raw.content.replace(/<[^>]*>?/gm, "").slice(0, 120);
  }

  return {
    id: raw.id,
    userId: raw.userId,
    topicId: raw.topicId,
    title: raw.title,
    content: raw.content ?? "",
    tags: raw.tags,
    tag: formattedTag,
    isLocked: raw.isLocked,
    isPinned: raw.isPinned,
    encryptedKey: raw.encryptedKey ?? null,
    excerpt: excerpt || "Nội dung ghi chú trong NoteVault...",
    date: new Date(raw.createdAt).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
    }),
    meta: "",
    metaType: "size",
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function normalizeTopic(raw: TopicResponseDto): Topic {
  return {
    id: raw.id,
    userId: raw.userId,
    name: raw.name,
    count: 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function fetchTopics(): Promise<Topic[]> {
  const { data, error } = await api.GET("/topics");
  if (error) {
    throw new Error(error.message);
  }
  return data.data.map((t) => normalizeTopic(t));
}

export async function createTopic(name: string, _icon?: string): Promise<Topic> {
  const { data, error } = await api.POST("/topics", {
    body: { name },
  });
  if (error) {
    throw new Error(error.message);
  }
  return normalizeTopic(data.data);
}

export async function updateTopic(id: string, updateData: { name?: string }): Promise<Topic> {
  const { data, error } = await api.PATCH("/topics/{id}", {
    params: { path: { id } },
    body: { name: updateData.name },
  });
  if (error) {
    throw new Error(error.message);
  }
  return normalizeTopic(data.data);
}

export async function deleteTopic(id: string): Promise<{ id?: string }> {
  const { data, error } = await api.DELETE("/topics/{id}", {
    params: { path: { id } },
  });
  if (error) {
    throw new Error(error.message);
  }
  return data.data;
}

export async function fetchNotes(topicId?: string, query?: string): Promise<Note[]> {
  const { data, error } = await api.GET("/notes", {
    params: {
      query: {
        topicId: topicId && topicId !== "locked" ? topicId : undefined,
        search: query ?? undefined,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.data.map((n) => normalizeNote(n));
}

export async function fetchNoteById(id: string, pin?: string, vaultToken?: string): Promise<Note> {
  const headers: Record<string, string> = {};
  if (pin) headers["x-private-pin"] = pin;
  if (vaultToken) headers["x-vault-token"] = vaultToken;

  const { data, error } = await api.GET("/notes/{id}", {
    params: { path: { id } },
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeNote(data.data);
}

export async function createNote(note: Partial<Note>): Promise<Note> {
  const { data, error } = await api.POST("/notes", {
    body: {
      title: note.title ?? "Ghi chú không tên",
      content: typeof note.content === "string" ? note.content : "",
      topicId: note.topicId ?? null,
      tags: note.tags && note.tags.length > 0 ? note.tags : [],
      isLocked: Boolean(note.isLocked),
      isPinned: Boolean(note.isPinned),
      pin: note.pin,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeNote(data.data);
}

export async function updateNote(id: string, note: Partial<Note>): Promise<Note> {
  const { data, error } = await api.PUT("/notes/{id}", {
    params: { path: { id } },
    body: {
      title: note.title,
      content: typeof note.content === "string" ? note.content : undefined,
      topicId: note.topicId,
      tags: note.tags,
      isLocked: note.isLocked,
      isPinned: note.isPinned,
      pin: note.pin,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeNote(data.data);
}

export function toggleNoteLock(id: string, isLocked: boolean, pin?: string): Promise<Note> {
  return updateNote(id, { isLocked: !isLocked, pin });
}

export async function deleteNote(id: string): Promise<{ id?: string }> {
  const { data, error } = await api.DELETE("/notes/{id}", {
    params: { path: { id } },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.data;
}

export async function toggleNotePin(id: string): Promise<Note> {
  const { data, error } = await api.POST("/notes/{id}/toggle-pin", {
    params: { path: { id } },
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeNote(data.data);
}
