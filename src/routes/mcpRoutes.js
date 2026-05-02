import { Router } from 'express'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createTaskMcpServer } from '../mcp/createTaskMcpServer.js'

const mcpRouter = Router()

mcpRouter.post('/', async (req, res) => {
  const server = createTaskMcpServer()

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })

    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)

    res.on('close', () => {
      transport.close().catch(() => {})
      server.close().catch(() => {})
    })
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

mcpRouter.get('/', (req, res) => {
  void req
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed.',
    },
    id: null,
  })
})

mcpRouter.delete('/', (req, res) => {
  void req
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed.',
    },
    id: null,
  })
})

export { mcpRouter }
