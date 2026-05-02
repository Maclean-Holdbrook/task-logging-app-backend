import { z } from 'zod'

const taskStatusEnum = z.enum(['pending', 'in_progress', 'completed', 'archived'])
const taskPriorityEnum = z.enum(['low', 'medium', 'high'])

const taskBaseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
  status: taskStatusEnum.default('pending'),
  priority: taskPriorityEnum.default('medium'),
  category: z.string().trim().max(80).default('General'),
  dueDate: z.string().trim().optional().or(z.literal('')),
  userId: z.string().uuid().optional(),
})

const createTaskSchema = taskBaseSchema

const updateTaskSchema = taskBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field must be provided for update.',
)

const updateStatusSchema = z.object({
  status: taskStatusEnum,
})

export {
  createTaskSchema,
  taskPriorityEnum,
  taskStatusEnum,
  updateStatusSchema,
  updateTaskSchema,
}
