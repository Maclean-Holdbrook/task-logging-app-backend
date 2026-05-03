import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

function parseTextResult(result) {
  const textPart = result.content?.find((item) => item.type === 'text')

  if (!textPart?.text) {
    throw new Error('Expected MCP tool result to include a text payload.')
  }

  return JSON.parse(textPart.text)
}

async function main() {
  const endpoint = process.env.MCP_HTTP_URL || 'http://127.0.0.1:4000/mcp'
  const authToken = process.env.MCP_AUTH_TOKEN
  const client = new Client({
    name: 'taskk-mcp-http-test-client',
    version: '0.1.0',
  })

  const requestInit = authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : undefined

  const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
    requestInit,
  })

  console.log('Connecting HTTP MCP client...')
  await client.connect(transport)
  console.log('Connected. Listing tools...')

  const tools = await client.listTools()
  const toolNames = tools.tools.map((tool) => tool.name)

  console.log('Creating task through HTTP MCP...')
  const createdResult = await client.callTool({
    name: 'create_task',
    arguments: {
      title: 'Hosted MCP verification task',
      description: 'Temporary task created by the HTTP MCP test client.',
      priority: 'low',
      status: 'pending',
      category: 'Testing',
    },
  })

  const createdTask = parseTextResult(createdResult)

  console.log('Listing tasks through HTTP MCP...')
  const listedResult = await client.callTool({
    name: 'list_tasks',
    arguments: {},
  })

  const listedPayload = parseTextResult(listedResult)
  const listedTasks = listedPayload.tasks || listedPayload

  console.log('Completing task through HTTP MCP...')
  const completedResult = await client.callTool({
    name: 'complete_task',
    arguments: {
      id: createdTask.id,
      outcome: 'Smoke test complete',
      impact: 'Verified persistence',
      project: 'QA',
      tags: ['smoke', 'http'],
    },
  })

  const completedTask = parseTextResult(completedResult)

  console.log('Checking preserved task through HTTP MCP...')
  const getAfterCompleteResult = await client.callTool({
    name: 'get_task',
    arguments: {
      id: createdTask.id,
    },
  })

  const fetchedCompletedTask = parseTextResult(getAfterCompleteResult)

  console.log(
    JSON.stringify(
      {
        transport: 'http',
        endpoint,
        tools: toolNames,
        createdTaskId: createdTask.id,
        listedTaskPresent: listedTasks.some((task) => task.id === createdTask.id),
        completedTaskId: completedTask.id,
        completedStatus: completedTask.status,
        completedAtPresent: Boolean(completedTask.completedAt),
        preservedAfterComplete: fetchedCompletedTask.id === createdTask.id,
      },
      null,
      2,
    ),
  )

  await transport.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
