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
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Màu sắc không hợp lệ")
    .optional()
    .default("#000000"),
  icon: z.string().trim().min(1).optional().default("folder"),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const topicIdParamSchema = z.object({
  id: z.string().min(1, "ID chủ đề không được để trống"),
});

export type TopicIdParam = z.infer<typeof topicIdParamSchema>;
