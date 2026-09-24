import { z } from 'zod'

export const MetaTypeSchema = z.enum([
  'size',
  'words',
  'code',
  'formula',
  'members',
  'lessons',
])
export type MetaType = z.infer<typeof MetaTypeSchema>

export const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  tag: z.string(),
  topicId: z.string(),
  isLocked: z.boolean(),
  excerpt: z.string(),
  content: z.string(), //thêm nội dung note 
  date: z.string(),
  meta: z.string(),
  metaType: MetaTypeSchema,
})
export type Note = z.infer<typeof NoteSchema>

export const TopicSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  count: z.number(),
  path: z.string(),
})
export type Topic = z.infer<typeof TopicSchema>

export const MetricVariantSchema = z.enum(['primary', 'secondary', 'tertiary'])
export type MetricVariant = z.infer<typeof MetricVariantSchema>

export const MetricItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  icon: z.string(),
  variant: MetricVariantSchema,
})
export type MetricItem = z.infer<typeof MetricItemSchema>

export const SortOptionSchema = z.enum(['Mới nhất', 'Cũ nhất', 'Theo tên (A-Z)'])
export type SortOption = z.infer<typeof SortOptionSchema>

export const ViewModeSchema = z.enum(['grid', 'list'])
export type ViewMode = z.infer<typeof ViewModeSchema>
