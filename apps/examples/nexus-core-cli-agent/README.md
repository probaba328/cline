# Nexus Core CLI Agent

An interactive terminal chat agent powered by the `NexusCore` runtime. This example is similar in spirit to [`cli-agent`](../cli-agent), but uses stateful NexusCore sessions and built-in runtime tools instead of the stateless `Agent` class, to leverage Nexus's internal agent harness.

## Getting started

Install dependencies:

```bash
bun install
bun run build:sdk
```

Set an API key:

```bash
export NEXUS_API_KEY="sk_..."
```

Run:

```bash
bun dev
```

Type any message at the `you:` prompt to see a streaming response. Type `exit` to quit.

## Optional model configuration

The example defaults to Nexus's gateway provider and Claude Sonnet:

```bash
export NEXUS_PROVIDER_ID="nexus"
export NEXUS_MODEL_ID="anthropic/claude-sonnet-4.6"
```

## What it does

- Creates a local `NexusCore` runtime with `NexusCore.create()`
- Starts one interactive session with `nexus.start()`
- Sends each user turn with `nexus.send({ sessionId, prompt })`
- Streams `agent_event` text to stdout as the assistant responds
- Logs tool calls and tool results inline
- Uses NexusCore's built-in tools instead of defining custom tools
- Calls `nexus.stop()` and `nexus.dispose()` during shutdown

## Concepts demonstrated

- Stateful sessions with `NexusCore`
- Multi-turn conversation using a single `sessionId`
- `CoreSessionEvent` subscription via `nexus.subscribe()`
- Built-in runtime tools (`read_files`, `search_codebase`, `run_commands`, etc.)
- Basic tool policies: file reads/search are auto-approved, other tools request approval

## Notes

Use this example when you want the full NexusCore runtime with sessions, persistence, and built-in tools. For the smallest possible SDK example, see [quickstart](../quickstart). For the lightweight stateless runtime, see [cli-agent](../cli-agent).
