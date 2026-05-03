import {
  createTaskSchema,
  listTasksQuerySchema,
  updateStatusSchema,
  updateTaskSchema,
} from '../validation/taskSchemas.js'
import {
  completeTask,
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from '../services/taskService.js'

function toArray(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return value
}

async function listTaskController(req, res) {
  const query = listTasksQuerySchema.parse({
    ...req.query,
    status: toArray(req.query.status),
    priority: toArray(req.query.priority),
    category: toArray(req.query.category),
    tags: toArray(req.query.tags),
  })
  const result = await listTasks(query)
  res.json(result)
}

async function getTaskController(req, res) {
  const task = await getTaskById(req.params.id)
  res.json({ task })
}

async function createTaskController(req, res) {
  const payload = createTaskSchema.parse(req.body)
  const task = await createTask(payload)
  res.status(201).json({ task })
}

async function updateTaskController(req, res) {
  const payload = updateTaskSchema.parse(req.body)
  const task = await updateTask(req.params.id, payload)
  res.json({ task })
}

async function updateTaskStatusController(req, res) {
  const payload = updateStatusSchema.parse(req.body)
  const task =
    payload.status === 'completed'
      ? await completeTask(req.params.id, payload)
      : await updateTask(req.params.id, payload)
  res.json({ task })
}

async function deleteTaskController(req, res) {
  await deleteTask(req.params.id)
  res.status(204).send()
}

export {
  createTaskController,
  deleteTaskController,
  getTaskController,
  listTaskController,
  updateTaskController,
  updateTaskStatusController,
}
