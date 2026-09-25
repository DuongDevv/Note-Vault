import { z } from "zod";

export const MetaTypeSchema = z.enum([
  "size",
  "words",
  "code",
  "formula",
  "members",
  "lessons",
]);
export type MetaType = z.infer<typeof MetaTypeSchema>;

export const NoteSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  title: z.string(),
  content: z
    .union([
      z.string(),
      z.record(z.string(), z.unknown()),
      z.array(z.unknown()),
    ])
    .nullable()
    .optional(),
  tags: z.array(z.string()).optional().default([]),
  tag: z.string().optional().default(""),
  topicId: z.string().nullable().optional(),
  isPinned: z.boolean().optional().default(false),
  isLocked: z.boolean().optional().default(false),
  excerpt: z.string().optional().default(""),
  date: z.string().optional().default("Hôm nay"),
  meta: z.string().optional().default(""),
  metaType: MetaTypeSchema.optional().default("size"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Note = z.infer<typeof NoteSchema>;

export const TopicSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  name: z.string(),
  slug: z.string().optional(),
  color: z.string().optional().default("#000000"),
  icon: z.string().optional().default("folder"),
  count: z.number().optional().default(0),
  path: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Topic = z.infer<typeof TopicSchema>;

export const SortOptionSchema = z.enum([
  "Mới nhất",
  "Cũ nhất",
  "Theo tên (A-Z)",
]);
export type SortOption = z.infer<typeof SortOptionSchema>;

export const ViewModeSchema = z.enum(["grid", "list"]);
export type ViewMode = z.infer<typeof ViewModeSchema>;
