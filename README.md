<p align="center">
  <img src="assets/icons/icon.png" width="80" alt="Nexus" />
</p>

<h1 align="center">Nexus</h1>

<p align="center">
  <strong>The coding agent that speaks your language</strong>
</p>

<p align="center">
  An open-source AI coding agent for your IDE and terminal — fork of <a href="https://github.com/cline/cline">Cline</a>
</p>

<div align="center">

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/probaba328/cline)](https://github.com/probaba328/cline/issues)

</div>

---

## What is Nexus?

Nexus is an open-source autonomous coding agent that integrates directly into your development environment. It can create and edit files, run terminal commands, browse the web, and coordinate changes across your entire codebase — all with your approval at every step.

Nexus is a fork of [Cline](https://github.com/cline/cline) with a focus on internationalization and global developer communities.

**Key principles:**
- **BYOK** — Bring your own API key. Works with any major LLM provider.
- **i18n** — Automatic interface language detection based on your system locale.
- **Open source** — Apache 2.0 license, fully transparent.
- **Secure** — API keys are stored encrypted locally.

---

## Installation

### VS Code Extension

Search for **Nexus** in the VS Code Extensions Marketplace, or install from source:

```bash
cd apps/vscode
bun install
bun run build:webview
bun esbuild.mjs
```

Then launch VS Code with the extension in development mode:

```bash
DISPLAY=:1 code --no-sandbox \
  --user-data-dir=/tmp/vscode-userdata \
  --extensionDevelopmentPath=$(pwd)/apps/vscode \
  .
```

### CLI

```bash
npm install -g @nexus/cli
nexus --help
```

Or run from source:

```bash
bun run cli
```

---

## Usage

### VS Code

Click the Nexus icon in the Activity Bar to open the chat panel. Type a task and Nexus will:

1. Explore your codebase to understand the context
2. Propose a plan
3. Make file edits with your approval
4. Run commands and react to output

### CLI

```bash
# Interactive mode
nexus -i

# One-shot task
nexus "Add unit tests for the auth module"

# Non-interactive (for CI/scripts)
nexus --no-interactive "Fix lint errors"
```

---

## Providers

Nexus works with all major LLM providers out of the box:

| Provider | Notes |
|----------|-------|
| Anthropic | Claude Sonnet, Opus, Haiku |
| OpenAI | GPT-4o, o1, o3 |
| Google | Gemini 2.0, 2.5 |
| AWS Bedrock | Cross-region inference |
| Azure OpenAI | Enterprise deployments |
| OpenRouter | 200+ models via single API |
| Ollama | Local models |
| LM Studio | Local models |

Configure your provider in the settings panel or via environment variables:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
nexus -i
```

---

## SDK

Build your own agents with the Nexus SDK:

```bash
npm install @nexus/sdk
```

```typescript
import { NexusCore } from "@nexus/sdk";

const core = new NexusCore({ /* config */ });
await core.start({ task: "Refactor the database layer" });
```

See the [SDK documentation](./sdk/README.md) for full API reference.

---

## MCP Servers

Extend Nexus with [Model Context Protocol](https://github.com/modelcontextprotocol) servers to connect to databases, APIs, cloud infrastructure, and external services.

```bash
# Manage MCP servers from the CLI
nexus mcp add <server-name>
nexus mcp list
```

---

## Development

### Prerequisites

- [Bun](https://bun.sh) `1.3.13`
- Node.js `>=22`

### Setup

```bash
git clone https://github.com/probaba328/cline.git
cd cline
bun install
bun run build:sdk
```

### Run tests

```bash
# All unit tests
bun run test:unit

# Specific package
bun -F @nexus/core test:unit
```

### Project structure

```
apps/
  cli/          — Terminal CLI (@nexus/cli)
  vscode/       — VS Code extension
  nexus-hub/    — Desktop hub service
sdk/
  packages/
    shared/     — Shared types & utilities (@nexus/shared)
    llms/       — LLM provider integrations (@nexus/llms)
    agents/     — Stateless agent loop (@nexus/agents)
    core/       — Session orchestration (@nexus/core)
    sdk/        — Public SDK entry point (@nexus/sdk)
```

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.

```bash
# Fork the repo, then:
git checkout -b feature/my-feature
bun run check   # lint + build + typecheck
git commit -m "feat: my feature"
git push origin feature/my-feature
```

---

## License

[Apache 2.0](./LICENSE) — Nexus is a fork of [Cline](https://github.com/cline/cline), which is also Apache 2.0 licensed.
