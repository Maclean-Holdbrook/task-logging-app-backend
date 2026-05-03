import crypto from 'node:crypto'
import { env } from '../config/env.js'

function unauthorized(res, message = 'Unauthorized') {
  res.status(401).json({
    jsonrpc: '2.0',
    error: {
      code: -32001,
      message,
    },
    id: null,
  })
}

function tokensMatch(expected, actual) {
  const expectedBuffer = Buffer.from(expected, 'utf8')
  const actualBuffer = Buffer.from(actual, 'utf8')

  if (expectedBuffer.length !== actualBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
}

function requireMcpAuth(req, res, next) {
  if (!env.mcpAuthToken) {
    if (env.isProduction) {
      unauthorized(res, 'MCP auth is not configured on the server')
      return
    }

    next()
    return
  }

  const authorization = req.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    unauthorized(res)
    return
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token || !tokensMatch(env.mcpAuthToken, token)) {
    unauthorized(res)
    return
  }

  next()
}

export { requireMcpAuth }
