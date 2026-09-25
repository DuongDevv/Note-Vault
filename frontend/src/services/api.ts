import { z } from "zod";
import { NoteSchema, TopicSchema, type Note, type Topic } from "@/types/note";
import { getAuthHeaders } from "./auth";
import { safeFetchJson } from "./http";

function unwrapResponse(json: unknown): unknown {
  if (json && typeof json === "object" && "data" in json) {
    const record = json as Record<string, unknown>;
    return record.data;
  }
  return json;
}

function normalizeNote(raw: Note): Note {
  const primaryTag = raw.tags.length > 0 ? (raw.tags[0] ?? "") : raw.tag;
  const formattedTag = primaryTag
    ? primaryTag.startsWith("#")
      ? primaryTag
      : `#${primaryTag}`
    : "";
  let excerpt = raw.excerpt;
  if (!excerpt && typeof raw.content === "string") {
    excerpt = raw.content.replace(/<[^>]*>?/gm, "").slice(0, 120);
  }

  return {
    ...raw,
    tag: formattedTag,
    excerpt: excerpt || "Nội dung ghi chú trong NoteVault...",
    date: raw.createdAt
      ? new Date(raw.createdAt).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        })
      : raw.date,
    meta: raw.meta || (raw.isLocked ? "Đã khóa PIN" : "Bản thảo"),
    metaType: raw.metaType,
  };
}

export async function fetchTopics(): Promise<Topic[]> {
  const { ok, data } = await safeFetchJson("/api/v1/topics", {
    headers: getAuthHeaders(),
  });
  if (!ok) throw new Error("Không thể tải danh sách chủ đề");
  const unwrapped = unwrapResponse(data);
  return z.array(TopicSchema).parse(unwrapped);
}

export async function createTopic(
  name: string,
  icon = "folder",
  color = "#000000",
): Promise<Topic> {
  const { ok, data } = await safeFetchJson("/api/v1/topics", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, icon, color }),
  });
  if (!ok) throw new Error("Không thể tạo chủ đề mới");
  const unwrapped = unwrapResponse(data);
  return TopicSchema.parse(unwrapped);
}

export async function fetchNotes(
  topicId?: string,
  query?: string,
): Promise<Note[]> {
  const params = new URLSearchParams();
  if (topicId && topicId !== "locked") params.set("topicId", topicId);
  if (query) params.set("search", query);

  const queryString = params.toString();
  const url = queryString ? `/api/v1/notes?${queryString}` : "/api/v1/notes";
  const { ok, data } = await safeFetchJson(url, {
    headers: getAuthHeaders(),
  });
  if (!ok) throw new Error("Không thể tải danh sách ghi chú");
  const unwrapped = unwrapResponse(data);
  const parsed = z.array(NoteSchema).parse(unwrapped);
  return parsed.map((n) => normalizeNote(n));
}

export async function fetchNoteById(id: string, pin?: string): Promise<Note> {
  const customHeaders: Record<string, string> = {};
  if (pin) {
    customHeaders["x-private-pin"] = pin;
  }

  const { ok, data } = await safeFetchJson(`/api/v1/notes/${id}`, {
    headers: getAuthHeaders(customHeaders),
  });
  if (!ok) throw new Error("Không thể tải chi tiết ghi chú");
  const unwrapped = unwrapResponse(data);
  const parsed = NoteSchema.parse(unwrapped);
  return normalizeNote(parsed);
}

export async function createNote(note: Partial<Note>): Promise<Note> {
  const tagList =
    note.tags && note.tags.length > 0 ? note.tags : note.tag ? [note.tag] : [];
  const payload = {
    title: note.title,
    content: note.content ?? "",
    topicId: note.topicId ?? null,
    tags: tagList,
    isPinned: Boolean(note.isPinned),
    isLocked: Boolean(note.isLocked),
  };

  const { ok, data } = await safeFetchJson("/api/v1/notes", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!ok) throw new Error("Không thể tạo ghi chú");
  const unwrapped = unwrapResponse(data);
  const parsed = NoteSchema.parse(unwrapped);
  return normalizeNote(parsed);
}

export async function updateNote(
  id: string,
  note: Partial<Note>,
): Promise<Note> {
  const { ok, data } = await safeFetchJson(`/api/v1/notes/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(note),
  });
  if (!ok) throw new Error("Không thể cập nhật ghi chú");
  const unwrapped = unwrapResponse(data);
  const parsed = NoteSchema.parse(unwrapped);
  return normalizeNote(parsed);
}

export async function toggleNoteLock(
  id: string,
  isLocked: boolean,
): Promise<Note> {
  return await updateNote(id, { isLocked: !isLocked });
}

const DeleteResponseSchema = z.object({
  id: z.string().optional(),
  success: z.boolean().optional(),
});

export type DeleteResponse = z.infer<typeof DeleteResponseSchema>;

export async function deleteNote(id: string): Promise<DeleteResponse> {
  const { ok, data } = await safeFetchJson(`/api/v1/notes/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!ok) throw new Error("Không thể xóa ghi chú");
  const unwrapped = unwrapResponse(data);
  return DeleteResponseSchema.parse(unwrapped);
}

export async function deleteTopic(id: string): Promise<DeleteResponse> {
  const { ok, data } = await safeFetchJson(`/api/v1/topics/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!ok) throw new Error("Không thể xóa chủ đề");
  const unwrapped = unwrapResponse(data);
  return DeleteResponseSchema.parse(unwrapped);
}
