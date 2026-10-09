# NexusCore Patterns

## Basic Session with Built-in Tools

```typescript
import { NexusCore } from "@nexus/sdk"

const nexus = await NexusCore.create({ clientName: "my-app" })

const session = await nexus.start({
  prompt: "Read package.json and summarize the dependencies",
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    apiKey: process.env.ANTHROPIC_API_KEY,
    cwd: process.cwd(),
    enableTools: true,
  },
})

console.log(session.result?.text)
await nexus.dispose()
```

## Streaming Session with UI Updates

```typescript
const nexus = await NexusCore.create({ clientName: "my-app" })

nexus.subscribe((event) => {
  switch (event.type) {
    case "chunk":
      if (event.payload.type === "text") {
        ui.appendText(event.payload.text)
      }
      break
    case "ended":
      ui.showComplete(event.payload.finishReason)
      break
  }
})

await nexus.start({
  prompt: "Refactor the auth module",
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    cwd: "/path/to/project",
    enableTools: true,
  },
})
```

## Multi-Turn Session

```typescript
const nexus = await NexusCore.create({ clientName: "my-app" })

const session = await nexus.start({
  prompt: "Create a new Express server",
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    cwd: "/path/to/project",
    enableTools: true,
  },
})

// Follow-up
const result = await nexus.send({
  sessionId: session.sessionId,
  prompt: "Now add a health check endpoint",
})

console.log(result?.text)
await nexus.dispose()
```

## Tiered Permission Model

Auto-approve reads, require approval for writes:

```typescript
const nexus = await NexusCore.create({
  clientName: "my-app",
  toolPolicies: {
    read_files: { autoApprove: true },
    search: { autoApprove: true },
    fetch_web: { autoApprove: true },
    bash: { autoApprove: false },
    editor: { autoApprove: false },
    apply_patch: { autoApprove: false },
  },
  capabilities: {
    requestToolApproval: async (request) => {
      const approved = await promptUser(
        `Allow ${request.toolName}?\n${JSON.stringify(request.input, null, 2)}`
      )
      return { approved }
    },
  },
})
```

## Custom Tools Alongside Built-ins

```typescript
import { NexusCore, createTool } from "@nexus/sdk"
import { z } from "zod"

const deployTool = createTool({
  name: "deploy",
  description: "Deploy the application to the specified environment.",
  inputSchema: z.object({
    environment: z.enum(["staging", "production"]),
  }),
  execute: async (input) => {
    const result = await runDeployment(input.environment)
    return { url: result.url, status: "deployed" }
  },
})

const nexus = await NexusCore.create({ clientName: "my-app" })

await nexus.start({
  prompt: "Deploy the app to staging",
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    cwd: process.cwd(),
    enableTools: true,
    tools: [deployTool],
  },
})
```

## Session with Plugins

Load plugins inline with `extensions` and provide workspace context so plugins can access `ctx.workspaceInfo`:

```typescript
import { NexusCore } from "@nexus/sdk"
import myPlugin from "./my-plugin"

const nexus = await NexusCore.create({
  clientName: "my-app",
  backendMode: "local",
})

await nexus.start({
  prompt: "Do the thing my plugin enables",
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    cwd: process.cwd(),
    enableTools: true,
    extensions: [myPlugin],
    extensionContext: {
      workspace: { rootPath: process.cwd(), cwd: process.cwd() },
    },
  },
})

await nexus.dispose()
```

For directory-based plugin packages, use `pluginPaths` instead:

```typescript
config: {
  pluginPaths: ["./my-nexus-plugin"],
  extensionContext: {
    workspace: { rootPath: process.cwd(), cwd: process.cwd() },
  },
}
```

See `../plugins/REFERENCE.md` for the full plugin authoring guide.

## Session Listing and Replay

```typescript
const nexus = await NexusCore.create({ clientName: "my-app" })

// List recent sessions
const sessions = await nexus.list(10)
for (const session of sessions) {
  console.log(`${session.id}: ${session.title}`)
}

// Read messages from a past session
const messages = await nexus.readMessages(sessions[0].id)
for (const msg of messages) {
  console.log(`[${msg.role}] ${msg.content}`)
}

// Check usage
const usage = await nexus.getAccumulatedUsage(sessions[0].id)
console.log(`Total tokens: ${usage.aggregateUsage.totalInputTokens + usage.aggregateUsage.totalOutputTokens}`)
```

## Graceful Shutdown

```typescript
const nexus = await NexusCore.create({ clientName: "my-app" })

process.on("SIGTERM", async () => {
  await nexus.dispose("SIGTERM received")
  process.exit(0)
})

// Run sessions...
```

## Stateless Worker Pattern

For request/response workloads (API endpoints, queue consumers):

```typescript
import { NexusCore } from "@nexus/sdk"

const nexus = await NexusCore.create({
  clientName: "worker",
  backendMode: "local",
})

async function handleRequest(prompt: string, workspace: string) {
  const session = await nexus.start({
    prompt,
    config: {
      providerId: "anthropic",
      modelId: "claude-sonnet-4-6",
      cwd: workspace,
      enableTools: true,
    },
  })

  return {
    text: session.result?.text,
    usage: session.result?.usage,
    sessionId: session.sessionId,
  }
}
```

## Hub-Backed Multi-Client

Multiple clients can attach to the same session:

```typescript
// Process 1: start session
const nexus = await NexusCore.create({
  clientName: "backend",
  backendMode: "hub",
})

const session = await nexus.start({
  prompt: "Long running refactor task",
  config: { ... },
})

// Process 2: attach and stream events
const viewer = await NexusCore.create({
  clientName: "dashboard",
  backendMode: "hub",
})

viewer.subscribe((event) => {
  dashboard.render(event)
}, { sessionId: session.sessionId })
```

## See Also

- `api.md` - Full API reference
- `gotchas.md` - Common pitfalls
- `../tools/REFERENCE.md` - Tool creation
- `../plugins/REFERENCE.md` - Plugin system
- `../scheduling/REFERENCE.md` - Scheduled agents
