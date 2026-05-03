import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  completeTask,
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from '../services/taskService.js'

const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'archived'])
const taskPrioritySchema = z.enum(['low', 'medium', 'high'])
const taskDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Expected a valid date string.',
})
const completionFieldsSchema = {
  completedAt: taskDateSchema.optional(),
  outcome: z.string().max(400).optional(),
  impact: z.string().max(400).optional(),
  project: z.string().max(120).optional(),
  client: z.string().max(120).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
}

function asTextContent(payload) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
  }
}

function createTaskMcpServer() {
  const server = new McpServer({
    name: 'taskk-mcp',
    version: '0.3.0',
  })

  server.tool(
    'list_tasks',
    'List task records with optional date filters, pagination, and sorting.',
    {
      startDate: taskDateSchema.optional(),
      endDate: taskDateSchema.optional(),
      dateField: z.enum(['createdAt', 'updatedAt', 'dueDate', 'completedAt']).optional(),
      status: z.union([taskStatusSchema, z.array(taskStatusSchema)]).optional(),
      priority: z.union([taskPrioritySchema, z.array(taskPrioritySchema)]).optional(),
      category: z.union([z.string().min(1), z.array(z.string().min(1))]).optional(),
      project: z.string().optional(),
      client: z.string().optional(),
      tags: z.union([z.string().min(1), z.array(z.string().min(1))]).optional(),
      search: z.string().optional(),
      sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'completedAt', 'priority', 'status', 'title']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      page: z.number().int().min(1).optional(),
      pageSize: z.number().int().min(1).max(100).optional(),
    },
    async (filters) => {
      const result = await listTasks(filters)
      return asTextContent(result)
    },
  )

  server.tool(
    'get_task',
    'Fetch a single task by id.',
    {
      id: z.string().uuid(),
    },
    async ({ id }) => {
      const task = await getTaskById(id)
      return asTextContent(task)
    },
  )

  server.tool(
    'create_task',
    'Create a new task log entry.',
    {
      title: z.string().min(1),
      description: z.string().optional(),
      status: taskStatusSchema.optional(),
      priority: taskPrioritySchema.optional(),
      category: z.string().optional(),
      dueDate: taskDateSchema.optional(),
      ...completionFieldsSchema,
      userId: z.string().uuid().optional(),
    },
    async (input) => {
      const task = await createTask({
        title: input.title,
        description: input.description || '',
        status: input.status || 'pending',
        priority: input.priority || 'medium',
        category: input.category || 'General',
        dueDate: input.dueDate || '',
        completedAt: input.completedAt,
        outcome: input.outcome,
        impact: input.impact,
        project: input.project,
        client: input.client,
        tags: input.tags,
        userId: input.userId,
      })

      return asTextContent(task)
    },
  )

  server.tool(
    'update_task',
    'Update fields on an existing task.',
    {
      id: z.string().uuid(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      status: taskStatusSchema.optional(),
      priority: taskPrioritySchema.optional(),
      category: z.string().optional(),
      dueDate: taskDateSchema.optional(),
      ...completionFieldsSchema,
    },
    async ({ id, ...updates }) => {
      const task = await updateTask(id, updates)
      return asTextContent(task)
    },
  )

  server.tool(
    'delete_task',
    'Delete a task.',
    {
      id: z.string().uuid(),
    },
    async ({ id }) => {
      const result = await deleteTask(id)
      return asTextContent(result)
    },
  )

  server.tool(
    'complete_task',
    'Complete a task and preserve it in the database with completion metadata.',
    {
      id: z.string().uuid(),
      ...completionFieldsSchema,
    },
    async ({ id, ...completion }) => {
      const task = await completeTask(id, completion)
      return asTextContent(task)
    },
  )

  return server
}

export { createTaskMcpServer }
