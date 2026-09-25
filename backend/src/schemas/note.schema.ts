import { z } from "zod";
import type { Models } from "../prisma/contract.d.ts";

export type Note = Models.public_Note;
export type NoteResponse = Omit<
  Models.public_Note,
  "createdAt" | "updatedAt" | "topic" | "user"
> & {
  createdAt: string;
  updatedAt: string;
};

export const getNotesQuerySchema = z.object({
  topicId: z.string().optional(),
  search: z.string().optional(),
});

export type GetNotesQuery = z.infer<typeof getNotesQuerySchema>;

// Supports structured JSON AST (ProseMirror / Tiptap) or string
export const noteContentSchema = z.union([
  z.string(),
  z.record(z.string(), z.unknown()),
  z.array(z.unknown()),
]);

export const createNoteSchema = z.object({
  topicId: z.string().nullable().optional(),
  title: z.string().trim().min(1, "Tiêu đề không được để trống"),
  content: noteContentSchema.optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  isPinned: z.boolean().optional().default(false),
  isLocked: z.boolean().optional().default(false),
  pin: z.string().optional(), // Optional PIN when creating locked note directly
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z.object({
  topicId: z.string().nullable().optional(),
  title: z.string().trim().min(1, "Tiêu đề không được để trống").optional(),
  content: noteContentSchema.optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  pin: z.string().optional(),
});

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const noteIdParamSchema = z.object({
  id: z.string().min(1, "ID ghi chú không được để trống"),
});

export type NoteIdParam = z.infer<typeof noteIdParamSchema>;
