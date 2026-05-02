import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'
import { AppError } from './appError.js'

function getSupabaseAdmin() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new AppError(
      'Supabase service credentials are not configured.',
      500,
    )
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export { getSupabaseAdmin }
