import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { healthRouter } from './routes/healthRoutes.js'
import { mcpRouter } from './routes/mcpRoutes.js'
import { taskRouter } from './routes/taskRoutes.js'

const app = express()

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.frontendOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`))
    },
  }),
)
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/tasks', taskRouter)
app.use('/mcp', mcpRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export { app }
