import { AppError } from '../lib/appError.js'
import { getSupabaseAdmin } from '../lib/supabase.js'

function mapTaskRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    category: row.category || 'General',
    dueDate: row.due_date || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id || null,
  }
}

async function listTasks() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new AppError('Failed to fetch tasks from Supabase.', 500, error)
  }

  return data.map(mapTaskRow)
}

async function getTaskById(taskId) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (error) {
    throw new AppError('Task not found.', 404, error)
  }

  return mapTaskRow(data)
}

async function createTask(taskInput) {
  const supabase = getSupabaseAdmin()
  const payload = {
    title: taskInput.title,
    description: taskInput.description,
    status: taskInput.status,
    priority: taskInput.priority,
    category: taskInput.category,
    due_date: taskInput.dueDate || null,
    user_id: taskInput.userId || null,
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new AppError('Failed to create task.', 500, error)
  }

  return mapTaskRow(data)
}

async function updateTask(taskId, updates) {
  const supabase = getSupabaseAdmin()
  const payload = {}

  if (updates.title !== undefined) payload.title = updates.title
  if (updates.description !== undefined) payload.description = updates.description
  if (updates.status !== undefined) payload.status = updates.status
  if (updates.priority !== undefined) payload.priority = updates.priority
  if (updates.category !== undefined) payload.category = updates.category
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate || null

  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select('*')
    .single()

  if (error) {
    throw new AppError('Failed to update task.', 500, error)
  }

  return mapTaskRow(data)
}

async function deleteTask(taskId) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) {
    throw new AppError('Failed to delete task.', 500, error)
  }

  return { id: taskId }
}

export { createTask, deleteTask, getTaskById, listTasks, updateTask }
