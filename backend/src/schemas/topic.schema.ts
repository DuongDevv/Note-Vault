import { z } from "zod";
import type { Models } from "../prisma/contract.d.ts";

export type Topic = Models.public_Topic;
export type TopicResponse = Omit<
  Models.public_Topic,
  "createdAt" | "updatedAt" | "notes" | "user"
> & {
  createdAt: string;
  updatedAt?: string;
};

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
