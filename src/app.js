import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requireMcpAuth } from './middleware/mcpAuth.js'
import { healthRouter } from './routes/healthRoutes.js'
import { mcpRouter } from './routes/mcpRoutes.js'
import { taskRouter } from './routes/taskRoutes.js'

const app = express()
const allowedOriginPatterns = [
  /^https:\/\/task-logging-app-mu\.vercel\.app$/i,
  /^https:\/\/task-logging-app(?:-[a-z0-9-]+)?\.vercel\.app$/i,
]

function isAllowedOrigin(origin) {
  if (!origin) {
    return true
  }

  if (env.frontendOrigins.includes(origin)) {
    return true
  }

  return allowedOriginPatterns.some((pattern) => pattern.test(origin))
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  }),
)
app.options('*', cors())
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/tasks', taskRouter)
app.use('/mcp', requireMcpAuth, mcpRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export { app }
