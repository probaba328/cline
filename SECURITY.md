# Security Policy

## Supported Versions

We actively patch only the most recent minor release of Nexus. Older versions receive fixes at our discretion.

## Reporting a Vulnerability

To report a security issue, please open a [GitHub Security Advisory](https://github.com/probaba328/cline/security/advisories/new) or email **security@nexus.bot**.

Please include:
- A short summary of the issue
- Steps to reproduce or a proof of concept
- Any logs or screenshots that help demonstrate the problem

Please keep details private until a resolution has been reached. We aim to respond within 72 hours.

---

## API Key Storage

All API keys and secrets are stored exclusively using [VS Code's SecretStorage API](https://code.visualstudio.com/api/references/vscode-api#SecretStorage), which encrypts credentials in the OS keychain (Keychain on macOS, Credential Manager on Windows, libsecret on Linux).

**What we guarantee:**
- API keys are never written to disk as plain text
- API keys are never included in log files
- API keys are never sent to Nexus servers
- The webview UI receives only masked/partial key info when needed for display purposes
- Keys are only transmitted to the AI provider endpoint that the user explicitly configures

---

## Data Collection (Telemetry)

Nexus collects **anonymous, non-personal usage data** to improve the product. Telemetry is **opt-in** and can be disabled at any time.

### What IS collected (when opted in)

| Category | Example events |
|----------|---------------|
| Feature usage | Task started, tool called, model selected |
| Performance | Token counts per request, response latency |
| Errors | Anonymized error types and stack traces |
| Extension version | Nexus version, VS Code version |

All events are identified only by a randomly generated device ID (no email, no username, no account data).

### What is NEVER collected

- Source code, file contents, or file paths
- Prompts, messages, or conversation history
- API keys or any credentials
- Personally identifiable information (PII)
- Your IP address (PostHog is configured with IP anonymization)

### Telemetry endpoint

Events are sent to `https://data.nexus.bot` (a self-hosted PostHog instance). No data is shared with third parties.

### Opt-out

**In VS Code settings:** set `telemetry.telemetryLevel` to `off` — Nexus respects the global VS Code telemetry setting.

**In Nexus settings:** open the Settings panel → Usage & Error Reporting → Disable.

When both are enabled, the Nexus-specific setting takes precedence. When VS Code global telemetry is disabled, Nexus telemetry is also disabled regardless of the Nexus setting.

---

## Network Access

Nexus only connects to:

1. **Your configured AI provider** — the endpoint you select in settings (Anthropic, OpenAI, Google, AWS Bedrock, Azure, OpenRouter, Ollama, LM Studio, or a custom URL you provide)
2. **Nexus telemetry endpoint** — `https://data.nexus.bot` (only when telemetry is enabled)
3. **OpenRouter model list** — `https://openrouter.ai/api/v1/models` (only when OpenRouter is selected as provider)
4. **Remote config** — optional feature-flag configuration, can be opted out via `optOutOfRemoteConfig` setting

Nexus does **not** phone home, does not send your code to any Nexus-controlled server, and does not require any account or login to function.

---

## Responsible Disclosure

We appreciate security researchers who responsibly disclose vulnerabilities. We will acknowledge your contribution in the release notes (unless you prefer to remain anonymous).
