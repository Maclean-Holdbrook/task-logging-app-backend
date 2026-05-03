import { AppError } from '../lib/appError.js'
import { getSupabaseAdmin } from '../lib/supabase.js'

const DATE_FIELD_TO_COLUMN = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  dueDate: 'due_date',
  completedAt: 'completed_at',
}

const SORT_FIELD_TO_COLUMN = {
  ...DATE_FIELD_TO_COLUMN,
  priority: 'priority',
  status: 'status',
  title: 'title',
}

function mapTaskRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    category: row.category || 'General',
    dueDate: row.due_date || '',
    completedAt: row.completed_at || '',
    outcome: row.outcome || '',
    impact: row.impact || '',
    project: row.project || '',
    client: row.client || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id || null,
  }
}

function toNullableText(value) {
  if (value === undefined) {
    return undefined
  }

  return value ? value : null
}

function normalizeTags(tags) {
  if (tags === undefined) {
    return undefined
  }

  return tags.length > 0 ? tags : []
}

function applyCompletionFields(payload, updates, fallbackStatus) {
  const nextStatus = updates.status ?? fallbackStatus
  const now = new Date().toISOString()
  const hasExplicitCompletedAt = updates.completedAt !== undefined && updates.completedAt !== ''

  if (hasExplicitCompletedAt) {
    payload.completed_at = updates.completedAt
  } else if (nextStatus === 'completed') {
    payload.completed_at = now
  } else if (updates.completedAt !== undefined || (updates.status !== undefined && nextStatus !== 'completed')) {
    payload.completed_at = null
  }

  if (updates.outcome !== undefined) payload.outcome = toNullableText(updates.outcome)
  if (updates.impact !== undefined) payload.impact = toNullableText(updates.impact)
  if (updates.project !== undefined) payload.project = toNullableText(updates.project)
  if (updates.client !== undefined) payload.client = toNullableText(updates.client)
  if (updates.tags !== undefined) payload.tags = normalizeTags(updates.tags)
}

function applyListFilters(query, options) {
  if (options.status?.length) {
    query = options.status.length === 1 ? query.eq('status', options.status[0]) : query.in('status', options.status)
  }

  if (options.priority?.length) {
    query =
      options.priority.length === 1
        ? query.eq('priority', options.priority[0])
        : query.in('priority', options.priority)
  }

  if (options.category?.length) {
    query =
      options.category.length === 1
        ? query.eq('category', options.category[0])
        : query.in('category', options.category)
  }

  if (options.project) {
    query = query.eq('project', options.project)
  }

  if (options.client) {
    query = query.eq('client', options.client)
  }

  if (options.tags?.length) {
    query = query.contains('tags', options.tags)
  }

  if (options.search) {
    const escaped = options.search.replaceAll(',', '\\,')
    query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`)
  }

  const dateColumn = DATE_FIELD_TO_COLUMN[options.dateField || 'createdAt']

  if (options.startDate) {
    query = query.gte(dateColumn, options.startDate)
  }

  if (options.endDate) {
    query = query.lte(dateColumn, options.endDate)
  }

  return query
}

function normalizeListOptions(options = {}) {
  const page = options.page || 1
  const pageSize = options.pageSize || 50

  return {
    ...options,
    dateField: options.dateField || 'createdAt',
    sortBy: options.sortBy || 'createdAt',
    sortOrder: options.sortOrder || 'desc',
    page,
    pageSize,
    status: options.status ? (Array.isArray(options.status) ? options.status : [options.status]) : undefined,
    priority: options.priority
      ? Array.isArray(options.priority)
        ? options.priority
        : [options.priority]
      : undefined,
    category: options.category
      ? Array.isArray(options.category)
        ? options.category
        : [options.category]
      : undefined,
    tags: options.tags ? (Array.isArray(options.tags) ? options.tags : [options.tags]) : undefined,
  }
}

async function listTasks(options = {}) {
  const normalizedOptions = normalizeListOptions(options)
  const from = (normalizedOptions.page - 1) * normalizedOptions.pageSize
  const to = from + normalizedOptions.pageSize - 1
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('tasks')
    .select('*', { count: 'exact' })

  query = applyListFilters(query, normalizedOptions)

  const sortColumn = SORT_FIELD_TO_COLUMN[normalizedOptions.sortBy] || 'created_at'
  const { data, error, count } = await query
    .order(sortColumn, { ascending: normalizedOptions.sortOrder === 'asc', nullsFirst: false })
    .range(from, to)

  if (error) {
    throw new AppError('Failed to fetch tasks from Supabase.', 500, error)
  }

  return {
    tasks: data.map(mapTaskRow),
    pagination: {
      page: normalizedOptions.page,
      pageSize: normalizedOptions.pageSize,
      total: count ?? data.length,
      totalPages: count === null ? 1 : Math.max(1, Math.ceil(count / normalizedOptions.pageSize)),
    },
  }
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
    updated_at: new Date().toISOString(),
  }

  applyCompletionFields(payload, taskInput, taskInput.status)

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
  const currentTask = await getTaskById(taskId)
  const payload = {
    updated_at: new Date().toISOString(),
  }

  if (updates.title !== undefined) payload.title = updates.title
  if (updates.description !== undefined) payload.description = updates.description
  if (updates.status !== undefined) payload.status = updates.status
  if (updates.priority !== undefined) payload.priority = updates.priority
  if (updates.category !== undefined) payload.category = updates.category
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate || null
  applyCompletionFields(payload, updates, currentTask.status)

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

async function completeTask(taskId, completion = {}) {
  return updateTask(taskId, {
    ...completion,
    status: 'completed',
    completedAt: completion.completedAt ?? new Date().toISOString(),
  })
}

async function deleteTask(taskId) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) {
    throw new AppError('Failed to delete task.', 500, error)
  }

  return { id: taskId }
}

export { completeTask, createTask, deleteTask, getTaskById, listTasks, updateTask }
