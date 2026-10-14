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
  currentPin: z
    .string()
    .regex(/^\d{6}$/, "Mã PIN hiện tại bắt buộc phải gồm đúng 6 chữ số")
    .optional(),
  newPin: z.string().regex(/^\d{6}$/, "Mã PIN mới bắt buộc phải gồm đúng 6 chữ số"),
});

export type SetPrivatePinInput = z.infer<typeof setPrivatePinSchema>;

export const verifyPinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, "Vui lòng nhập mã PIN gồm 6 chữ số"),
});

export type VerifyPinInput = z.infer<typeof verifyPinSchema>;

export const userProfileResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  displayName: z.string(),
  hasPrivatePin: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;

export const authResponseDataSchema = z.object({
  user: userProfileResponseSchema,
  accessToken: z.string(),
});

export type AuthResponseData = z.infer<typeof authResponseDataSchema>;

export const verifyPinResponseDataSchema = z.object({
  verified: z.boolean(),
  vaultToken: z.string(),
});

export type VerifyPinResponseData = z.infer<typeof verifyPinResponseDataSchema>;

export const lockVaultResponseDataSchema = z.object({
  locked: z.boolean(),
});

export type LockVaultResponseData = z.infer<typeof lockVaultResponseDataSchema>;
