import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { createTaskMcpServer } from '../mcp/createTaskMcpServer.js'

const mcpRouter = Router()
const sessions = new Map()

function getSessionId(req) {
  const header = req.headers['mcp-session-id']
  return Array.isArray(header) ? header[0] : header
}

async function closeSession(sessionId) {
  const session = sessions.get(sessionId)

  if (!session) {
    return
  }

  sessions.delete(sessionId)

  await Promise.allSettled([
    session.transport.close(),
    session.server.close(),
  ])
}

function getOrCreateSessionTransport() {
  const server = createTaskMcpServer()
  let transport

  transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized(sessionId) {
      sessions.set(sessionId, { server, transport })
    },
  })

  return { server, transport }
}

mcpRouter.post('/', async (req, res) => {
  try {
    const sessionId = getSessionId(req)
    const existingSession = sessionId ? sessions.get(sessionId) : undefined

    if (existingSession) {
      await existingSession.transport.handleRequest(req, res, req.body)
      return
    }

    if (!isInitializeRequest(req.body)) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      })
      return
    }

    const { server, transport } = getOrCreateSessionTransport()

    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  } catch (error) {
    console.error('Error handling MCP HTTP request:', error)

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      })
    }
  }
})

mcpRouter.get('/', async (req, res) => {
  const sessionId = getSessionId(req)
  const session = sessionId ? sessions.get(sessionId) : undefined

  if (!session) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    })
    return
  }

  try {
    await session.transport.handleRequest(req, res)
  } catch (error) {
    console.error('Error handling MCP HTTP GET request:', error)

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      })
    }
  }
})

mcpRouter.delete('/', async (req, res) => {
  const sessionId = getSessionId(req)
  const session = sessionId ? sessions.get(sessionId) : undefined

  if (!sessionId || !session) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    })
    return
  }

  try {
    await session.transport.handleRequest(req, res)
  } catch (error) {
    console.error('Error handling MCP HTTP DELETE request:', error)

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      })
    }
  } finally {
    await closeSession(sessionId)
  }
})

export { mcpRouter }
