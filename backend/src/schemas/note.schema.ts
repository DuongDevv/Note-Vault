import { z } from "zod";

export const getNotesQuerySchema = z.object({
  topicId: z.string().optional(),
  search: z.string().optional(),
});

export type GetNotesQuery = z.infer<typeof getNotesQuerySchema>;

export const createNoteSchema = z.object({
  topicId: z.string().nullable().optional(),
  title: z.string().trim().min(1, "Tiêu đề không được để trống"),
  content: z.string().trim().min(1, "Nội dung không được để trống"),
  isPinned: z.boolean().optional().default(false),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z.object({
  topicId: z.string().nullable().optional(),
  title: z.string().trim().min(1, "Tiêu đề không được để trống").optional(),
  content: z.string().trim().min(1, "Nội dung không được để trống").optional(),
  isPinned: z.boolean().optional(),
});

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const noteIdParamSchema = z.object({
  id: z.string().min(1, "ID ghi chú không được để trống"),
});

export type NoteIdParam = z.infer<typeof noteIdParamSchema>;

export interface NoteDbRow {
  id: string;
  user_id: string;
  topic_id: string | null;
  title: string;
  content: string;
  is_pinned: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}
