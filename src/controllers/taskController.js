import {
  createTaskSchema,
  updateStatusSchema,
  updateTaskSchema,
} from '../validation/taskSchemas.js'
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from '../services/taskService.js'

async function listTaskController(req, res) {
  void req
  const tasks = await listTasks()
  res.json({ tasks })
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
  const task = await updateTask(req.params.id, payload)
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
