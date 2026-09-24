import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().trim().min(3, "Username phải có ít nhất 3 ký tự"),
  email: z.email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  displayName: z.string().trim().min(1, "Display name không được để trống"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Vui lòng nhập username"),
  password: z.string().min(1, "Vui lòng nhập password"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const setPrivatePinSchema = z.object({
  newPin: z.string().regex(/^\d{6}$/, "Mã PIN bắt buộc phải gồm đúng 6 chữ số"),
});

export type SetPrivatePinInput = z.infer<typeof setPrivatePinSchema>;

export interface UserDbRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
}

export interface ProfileDbRow {
  id: string;
  username: string;
  email: string;
  display_name: string;
  theme: string;
  has_private_pin: boolean;
}
