# NexusCore Runtime

`NexusCore` is the full-featured runtime from `@nexus/core`. It wraps the `Agent` loop with session persistence, built-in tools (bash, editor, file reading, search, web fetch), config discovery, plugin loading, and optional hub-backed multi-process support.

## When to Use NexusCore

| Use NexusCore when... | Use Agent instead when... |
|---|---|
| You need built-in tools (bash, editor, etc.) | You only need custom tools |
| You want session persistence to disk | Stateless is fine |
| You need config discovery from `.nexus/` dirs | You handle config yourself |
| You want scheduled/automated agents | You don't need scheduling |
| You need multi-client session sharing | Single-process is fine |
| You're building a full application | You want minimal dependencies |

## Quick Start

```typescript
import { NexusCore } from "@nexus/sdk"

const nexus = await NexusCore.create({ clientName: "my-app" })

const session = await nexus.start({
  prompt: "Set up CI with GitHub Actions",
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    apiKey: process.env.ANTHROPIC_API_KEY,
    cwd: "/path/to/project",
    enableTools: true,
  },
})

console.log(session.result?.text)
await nexus.dispose()
```

## Core Concepts

### Sessions

Every `nexus.start()` call creates a session with a unique ID. Sessions persist their messages and metadata to SQLite. You can list, read, resume, and delete sessions.

### Built-in Tools

NexusCore provides these tools automatically when `enableTools: true`:

| Tool | Description |
|------|-------------|
| `bash` | Execute shell commands |
| `editor` | Edit files |
| `read_files` | Read file contents |
| `apply_patch` | Apply unified diffs |
| `search` | Search file contents and structure |
| `fetch_web` | HTTP requests and web content |

### Config Discovery

NexusCore watches `.nexus/` directories for:
- Rules (system prompt additions)
- Skills (domain knowledge)
- Workflows (multi-step procedures)
- Hooks (lifecycle logic)
- Plugins (tool + hook bundles)
- MCP servers (external tool providers)

### Backend Modes

| Mode | Description |
|------|-------------|
| `"auto"` (default) | Tries to connect to a local hub; falls back to in-process if unavailable |
| `"local"` | In-process execution, local SQLite storage, no hub |
| `"hub"` | Requires a compatible local WebSocket hub; fails if unavailable |
| `"remote"` | Connects to an explicit remote hub endpoint |

The default mode is `"auto"`. For simple scripts and CLI tools, `"local"` avoids hub discovery overhead. Hub mode enables multi-client session sharing (e.g., a dashboard watching a running session from another process).

## Key APIs

- `NexusCore.create(options)` - Create and initialize
- `nexus.start(input)` - Start a new session
- `nexus.send({ sessionId, prompt })` - Send follow-up message
- `nexus.subscribe(listener)` - Listen to session events
- `nexus.list()` - List sessions
- `nexus.get(sessionId)` - Get session metadata
- `nexus.readMessages(sessionId)` - Read persisted messages
- `nexus.getAccumulatedUsage(sessionId)` - Token/cost totals
- `nexus.abort(sessionId)` - Abort a session
- `nexus.delete(sessionId)` - Delete a session
- `nexus.dispose()` - Clean up resources

See `api.md` for full API details.

## Event Streaming

`nexus.subscribe()` emits `CoreSessionEvent` types. These are different from the `AgentRuntimeEvent` types emitted by the standalone `Agent` class -- see `../events/REFERENCE.md` for the full comparison.

```typescript
nexus.subscribe((event) => {
  switch (event.type) {
    case "chunk":
      if (event.payload.type === "text") {
        process.stdout.write(event.payload.text)
      }
      break
    case "ended":
      console.log(`Session ended: ${event.payload.finishReason}`)
      break
  }
})
```

NexusCore results use `AgentResult` with `.text` (not `.outputText` like the standalone Agent's `AgentRunResult`).

## Session Persistence

Sessions are stored at:
```
~/.nexus/data/sessions/
  sessions.db       # SQLite database
  [session-id].json # Message history
```

## Next Steps

- `api.md` - Full NexusCore API reference
- `patterns.md` - Common patterns and best practices
- `gotchas.md` - Pitfalls and debugging
- `../tools/REFERENCE.md` - Custom tool creation
- `../plugins/REFERENCE.md` - Plugin system
- `../scheduling/REFERENCE.md` - Scheduled agents
