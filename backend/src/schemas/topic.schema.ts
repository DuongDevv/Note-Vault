import { z } from "zod";

export const createTopicSchema = z.object({
  name: z.string().trim().min(1, "Tên chủ đề không được để rỗng"),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Màu sắc không hợp lệ")
    .optional()
    .default("#000000"),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const topicIdParamSchema = z.object({
  id: z.string().min(1, "ID chủ đề không được để trống"),
});

export type TopicIdParam = z.infer<typeof topicIdParamSchema>;

export interface TopicDbRow {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
  updated_at?: string;
}
