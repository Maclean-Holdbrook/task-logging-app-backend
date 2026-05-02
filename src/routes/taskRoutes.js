import { Router } from 'express'
import {
  createTaskController,
  deleteTaskController,
  getTaskController,
  listTaskController,
  updateTaskController,
  updateTaskStatusController,
} from '../controllers/taskController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

const taskRouter = Router()

taskRouter.get('/', asyncHandler(listTaskController))
taskRouter.get('/:id', asyncHandler(getTaskController))
taskRouter.post('/', asyncHandler(createTaskController))
taskRouter.put('/:id', asyncHandler(updateTaskController))
taskRouter.patch('/:id/status', asyncHandler(updateTaskStatusController))
taskRouter.delete('/:id', asyncHandler(deleteTaskController))

export { taskRouter }
