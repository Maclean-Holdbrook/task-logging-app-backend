import { Router } from 'express'

const healthRouter = Router()

healthRouter.get('/', (req, res) => {
  void req
  res.json({
    ok: true,
    service: 'taskk-backend',
  })
})

export { healthRouter }
