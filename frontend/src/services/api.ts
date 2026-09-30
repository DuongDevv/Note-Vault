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

async function fetchAndParse<T>(
  url: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
  errorMessage = "Yêu cầu thất bại",
): Promise<T> {
  let customHeaders: Record<string, string> | undefined;
  if (
    options.headers &&
    typeof options.headers === "object" &&
    !(options.headers instanceof Headers)
  ) {
    customHeaders = Object.fromEntries(
      Object.entries(options.headers).map(([k, v]) => [k, String(v)]),
    );
  }

  const { ok, data } = await safeFetchJson(url, {
    ...options,
    headers: getAuthHeaders(customHeaders),
  });
  if (!ok) {
    const serverMessage =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : errorMessage;
    throw new Error(serverMessage);
  }
  const unwrapped = unwrapResponse(data);
  return schema.parse(unwrapped);
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
    meta: raw.meta ? raw.meta : raw.isLocked ? "Đã khóa PIN" : "Bản thảo",
    metaType: raw.metaType,
  };
}

export async function fetchTopics(): Promise<Topic[]> {
  return await fetchAndParse(
    "/api/v1/topics",
    z.array(TopicSchema),
    {},
    "Không thể tải danh sách chủ đề",
  );
}

export async function createTopic(
  name: string,
  icon = "folder",
  color = "#000000",
): Promise<Topic> {
  return await fetchAndParse(
    "/api/v1/topics",
    TopicSchema,
    {
      method: "POST",
      body: JSON.stringify({ name, icon, color }),
    },
    "Không thể tạo chủ đề mới",
  );
}

export async function updateTopic(
  id: string,
  data: { name?: string; color?: string; icon?: string },
): Promise<Topic> {
  return await fetchAndParse(
    `/api/v1/topics/${id}`,
    TopicSchema,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    "Không thể cập nhật chủ đề",
  );
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
  const parsed = await fetchAndParse(
    url,
    z.array(NoteSchema),
    {},
    "Không thể tải danh sách ghi chú",
  );
  return parsed.map((n) => normalizeNote(n));
}

export async function fetchNoteById(id: string, pin?: string): Promise<Note> {
  const parsed = await fetchAndParse(
    `/api/v1/notes/${id}`,
    NoteSchema,
    {
      headers: pin ? { "x-private-pin": pin } : undefined,
    },
    "Không thể tải chi tiết ghi chú",
  );
  return normalizeNote(parsed);
}

export async function createNote(note: Partial<Note>): Promise<Note> {
  const payload = {
    title: note.title,
    content: note.content ?? "",
    topicId: note.topicId ?? null,
    tags: note.tags && note.tags.length > 0 ? note.tags : [],
    isLocked: Boolean(note.isLocked),
  };

  const parsed = await fetchAndParse(
    "/api/v1/notes",
    NoteSchema,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Không thể tạo ghi chú",
  );
  return normalizeNote(parsed);
}

export async function updateNote(
  id: string,
  note: Partial<Note>,
): Promise<Note> {
  const parsed = await fetchAndParse(
    `/api/v1/notes/${id}`,
    NoteSchema,
    {
      method: "PUT",
      body: JSON.stringify(note),
    },
    "Không thể cập nhật ghi chú",
  );
  return normalizeNote(parsed);
}

export function toggleNoteLock(
  id: string,
  isLocked: boolean,
  pin?: string,
): Promise<Note> {
  return updateNote(id, { isLocked: !isLocked, pin });
}

const DeleteResponseSchema = z.object({
  id: z.string().optional(),
  success: z.boolean().optional(),
});

export type DeleteResponse = z.infer<typeof DeleteResponseSchema>;

export async function deleteNote(id: string): Promise<DeleteResponse> {
  return await fetchAndParse(
    `/api/v1/notes/${id}`,
    DeleteResponseSchema,
    { method: "DELETE" },
    "Không thể xóa ghi chú",
  );
}

export async function deleteTopic(id: string): Promise<DeleteResponse> {
  return await fetchAndParse(
    `/api/v1/topics/${id}`,
    DeleteResponseSchema,
    { method: "DELETE" },
    "Không thể xóa chủ đề",
  );
}
