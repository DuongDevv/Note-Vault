import { z } from "zod";

export const topicResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type TopicResponse = z.infer<typeof topicResponseSchema>;

export const createTopicSchema = z.object({
  name: z.string().trim().min(1, "Tên chủ đề không được để rỗng"),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const updateTopicSchema = z.object({
  name: z.string().trim().min(1, "Tên chủ đề không được để rỗng").optional(),
});

export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

export const topicIdParamSchema = z.object({
  id: z.string().min(1, "ID chủ đề không được để trống"),
});

export type TopicIdParam = z.infer<typeof topicIdParamSchema>;
