import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

function parseTextResult(result) {
  const textPart = result.content?.find((item) => item.type === 'text')

  if (!textPart?.text) {
    throw new Error('Expected MCP tool result to include a text payload.')
  }

  return JSON.parse(textPart.text)
}

async function main() {
  const client = new Client({
    name: 'taskk-mcp-test-client',
    version: '0.1.0',
  })

  const transport = new StdioClientTransport({
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'mcp'],
    cwd: process.cwd(),
    env: process.env,
    stderr: 'pipe',
  })

  transport.stderr?.on('data', (chunk) => {
    const message = chunk.toString().trim()

    if (message) {
      console.error(message)
    }
  })

  await client.connect(transport)

  const tools = await client.listTools()
  const toolNames = tools.tools.map((tool) => tool.name)

  const createdResult = await client.callTool({
    name: 'create_task',
    arguments: {
      title: 'MCP verification task',
      description: 'Temporary task created by the MCP test client.',
      priority: 'low',
      status: 'pending',
      category: 'Testing',
    },
  })

  const createdTask = parseTextResult(createdResult)

  const listedResult = await client.callTool({
    name: 'list_tasks',
    arguments: {},
  })

  const listedPayload = parseTextResult(listedResult)
  const listedTasks = listedPayload.tasks || listedPayload

  const completedResult = await client.callTool({
    name: 'complete_task',
    arguments: {
      id: createdTask.id,
      outcome: 'Smoke test complete',
      impact: 'Verified stdio MCP completion persistence',
      project: 'QA',
      tags: ['smoke', 'stdio'],
    },
  })

  const completedTask = parseTextResult(completedResult)

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
