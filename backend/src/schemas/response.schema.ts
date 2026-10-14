import { z } from "zod";

export function createSuccessEnvelopeSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    statusCode: z.number(),
    message: z.string(),
    data: dataSchema,
    meta: z.unknown().optional(),
  });
}

export const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  statusCode: z.number(),
  message: z.string(),
  error: z.string(),
  details: z.unknown().optional(),
  timeStamp: z.string(),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
