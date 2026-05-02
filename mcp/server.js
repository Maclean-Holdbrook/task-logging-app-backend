import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createTaskMcpServer } from '../src/mcp/createTaskMcpServer.js'

const server = createTaskMcpServer()
const transport = new StdioServerTransport()

await server.connect(transport)
