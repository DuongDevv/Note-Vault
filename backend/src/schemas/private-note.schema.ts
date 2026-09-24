import { z } from "zod";

export const verifyPinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, "Vui lòng nhập mã PIN 6 chữ số"),
});

export type VerifyPinInput = z.infer<typeof verifyPinSchema>;

export const createPrivateNoteSchema = z.object({
  title: z.string().trim().min(1, "Tiêu đề là bắt buộc"),
  content: z.string().trim().min(1, "Nội dung là bắt buộc"),
  isPinned: z.boolean().optional().default(false),
});

export type CreatePrivateNoteInput = z.infer<typeof createPrivateNoteSchema>;

export const privateNoteIdParamSchema = z.object({
  id: z.string().min(1, "ID ghi chú không được để trống"),
});

export type PrivateNoteIdParam = z.infer<typeof privateNoteIdParamSchema>;

export interface PrivateNoteDbRow {
  id: string;
  title: string;
  encrypted_content: string;
  iv: string;
  auth_tag: string;
  is_pinned: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProfilePinDbRow {
  private_pin_hash: string | null;
}
