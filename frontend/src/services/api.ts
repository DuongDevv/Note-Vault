import { z } from "zod";
import { NoteSchema, TopicSchema, type Note, type Topic } from "@/types/note";

export async function fetchTopics(): Promise<Topic[]> {
  const res = await fetch("/api/topics");
  if (!res.ok) throw new Error("Không thể tải danh sách chủ đề");
  const data: unknown = await res.json();
  return z.array(TopicSchema).parse(data);
}

export async function createTopic(name: string): Promise<Topic> {
  const res = await fetch("/api/topics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Không thể tạo chủ đề mới");
  const data: unknown = await res.json();
  return TopicSchema.parse(data);
}

export async function fetchNotes(
  topicId?: string,
  query?: string,
): Promise<Note[]> {
  const params = new URLSearchParams();
  if (topicId) params.set("topicId", topicId);
  if (query) params.set("q", query);

  const url = `/api/notes${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Không thể tải danh sách ghi chú");
  const data: unknown = await res.json();
  return z.array(NoteSchema).parse(data);
}

export async function createNote(
  note: Pick<Note, "title" | "tag" | "topicId" | "isLocked" | "excerpt">,
): Promise<Note> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error("Không thể tạo ghi chú");
  const data: unknown = await res.json();
  return NoteSchema.parse(data);
}

export async function toggleNoteLock(id: string): Promise<Note> {
  const res = await fetch(`/api/notes/${id}/toggle-lock`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Không thể đổi trạng thái khóa");
  const data: unknown = await res.json();
  return NoteSchema.parse(data);
}

const DeleteResponseSchema = z.object({
  success: z.boolean(),
  id: z.string(),
});

export type DeleteResponse = z.infer<typeof DeleteResponseSchema>;

export async function deleteNote(id: string): Promise<DeleteResponse> {
  const res = await fetch(`/api/notes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Không thể xóa ghi chú");
  const data: unknown = await res.json();
  return DeleteResponseSchema.parse(data);
}
