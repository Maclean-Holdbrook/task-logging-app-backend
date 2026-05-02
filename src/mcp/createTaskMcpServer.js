import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from '../services/taskService.js'

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
    version: '0.2.0',
  })

  server.tool('list_tasks', 'List all task records.', {}, async () => {
    const tasks = await listTasks()
    return asTextContent(tasks)
  })

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
      status: z.enum(['pending', 'in_progress', 'completed', 'archived']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      category: z.string().optional(),
      dueDate: z.string().optional(),
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
      status: z.enum(['pending', 'in_progress', 'completed', 'archived']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      category: z.string().optional(),
      dueDate: z.string().optional(),
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
    'Complete a task and remove it from the database.',
    {
      id: z.string().uuid(),
    },
    async ({ id }) => {
      const task = await getTaskById(id)
      await deleteTask(id)
      return asTextContent(task)
    },
  )

  return server
}

export { createTaskMcpServer }
