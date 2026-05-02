import { app } from './app.js'
import { env } from './config/env.js'

app.listen(env.port, () => {
  console.log(`Taskk backend listening on http://localhost:${env.port}`)
})
