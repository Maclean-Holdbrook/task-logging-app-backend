import 'dotenv/config'

function readEnv(name, fallback = '') {
  return process.env[name] || fallback
}

function readOrigins(value) {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

const env = {
  port: Number(readEnv('PORT', '4000')),
  frontendOrigin: readEnv(
    'FRONTEND_ORIGIN',
    'http://localhost:5173,http://127.0.0.1:4173,http://127.0.0.1:5173',
  ),
  frontendOrigins: readOrigins(
    readEnv(
      'FRONTEND_ORIGIN',
      'http://localhost:5173,http://127.0.0.1:4173,http://127.0.0.1:5173',
    ),
  ),
  supabaseUrl: readEnv('SUPABASE_URL'),
  supabaseAnonKey: readEnv('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: readEnv('SUPABASE_SERVICE_ROLE_KEY'),
}

export { env }
