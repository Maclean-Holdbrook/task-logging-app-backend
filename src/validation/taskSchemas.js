import { z } from 'zod'

const taskStatusEnum = z.string().trim().min(1).max(40)
const taskPriorityEnum = z.string().trim().min(1).max(40)
const dateStringSchema = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Expected a valid date string.',
})
const optionalDateFieldSchema = dateStringSchema.optional().or(z.literal(''))
const optionalTrimmedStringSchema = (max) => z.string().trim().max(max).optional()
const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(20)

const taskBaseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
  status: taskStatusEnum.default('pending'),
  priority: taskPriorityEnum.default('medium'),
  category: z.string().trim().max(80).default('General'),
  dueDate: optionalDateFieldSchema,
  completedAt: optionalDateFieldSchema,
  outcome: optionalTrimmedStringSchema(400),
  impact: optionalTrimmedStringSchema(400),
  project: optionalTrimmedStringSchema(120),
  client: optionalTrimmedStringSchema(120),
  tags: tagsSchema.optional(),
  userId: z.string().uuid().optional(),
})

const createTaskSchema = taskBaseSchema

const updateTaskSchema = taskBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field must be provided for update.',
)

const updateStatusSchema = z.object({
  status: taskStatusEnum,
  completedAt: optionalDateFieldSchema.optional(),
  outcome: optionalTrimmedStringSchema(400),
  impact: optionalTrimmedStringSchema(400),
  project: optionalTrimmedStringSchema(120),
  client: optionalTrimmedStringSchema(120),
  tags: tagsSchema.optional(),
})

const listTasksQuerySchema = z.object({
  startDate: optionalDateFieldSchema.optional(),
  endDate: optionalDateFieldSchema.optional(),
  dateField: z.enum(['createdAt', 'updatedAt', 'dueDate', 'completedAt']).optional(),
  status: z.union([taskStatusEnum, z.array(taskStatusEnum)]).optional(),
  priority: z.union([taskPriorityEnum, z.array(taskPriorityEnum)]).optional(),
  category: z.union([z.string().trim().min(1).max(80), z.array(z.string().trim().min(1).max(80))]).optional(),
  project: z.string().trim().max(120).optional(),
  client: z.string().trim().max(120).optional(),
  tags: z.union([z.string().trim().min(1).max(40), z.array(z.string().trim().min(1).max(40))]).optional(),
  search: z.string().trim().max(120).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'completedAt', 'priority', 'status', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

export {
  createTaskSchema,
  listTasksQuerySchema,
  taskPriorityEnum,
  taskStatusEnum,
  updateStatusSchema,
  updateTaskSchema,
}
