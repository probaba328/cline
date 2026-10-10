<p align="center">
  <img src="assets/icons/nexus-logo.svg" width="80" alt="Nexus" />
</p>

<h1 align="center">Nexus</h1>

<p align="center">
  <strong>The coding agent that speaks your language</strong>
</p>

<p align="center">
  <a href="https://github.com/probaba328/cline/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License: Apache 2.0" />
  </a>
  <a href="https://github.com/probaba328/cline/issues">
    <img src="https://img.shields.io/github/issues/probaba328/cline" alt="GitHub Issues" />
  </a>
  <a href="https://github.com/probaba328/cline/blob/main/CONTRIBUTING_TRANSLATION.md">
    <img src="https://img.shields.io/badge/i18n-13%20languages-green" alt="13 languages" />
  </a>
</p>

---

## What is Nexus?

Nexus is an open-source autonomous coding agent that lives inside your IDE and terminal. It reads and edits your files, runs terminal commands, browses the web, and coordinates changes across your entire codebase — always with your explicit approval at every step. Nexus is a fork of [Cline](https://github.com/cline/cline) rebuilt around three core beliefs: that great developer tools should work in every language, that your API keys belong to you alone, and that nothing should happen in your editor without your knowledge.

---

## Why Nexus?

Nexus shares Cline's powerful agent core but diverges in three important ways:

| | Cline | Nexus |
|---|---|---|
| **Interface language** | English only | 13 languages, auto-detected from your IDE locale |
| **API key ownership** | BYOK | BYOK — keys stored in OS keychain only, never sent to Nexus servers |
| **Telemetry** | Opt-out | Opt-in — disabled by default, anonymous usage only |
| **Fork goal** | General coding agent | Global developer communities |

### i18n — first-class internationalization

Nexus automatically detects your VS Code display language and switches the UI accordingly. No configuration needed. If your language isn't fully translated yet, it falls back gracefully to English — and you can help fix that (see [Contributing Translations](#contributing-translations) below).

### Security by design

Every API key you enter is stored exclusively in your operating system's credential store (macOS Keychain, Windows Credential Manager, Linux libsecret) via VS Code's SecretStorage API. Nexus never writes credentials to disk as plain text, never logs them, and never transmits them anywhere except the AI provider endpoint you configure. See [SECURITY.md](./SECURITY.md) for the full policy.

### Bring Your Own Key (BYOK)

Nexus requires no account, no subscription, and no Nexus-controlled backend to function. Bring your key from any supported provider, plug it in, and start coding. You pay your provider directly; Nexus takes nothing.

---

## Installation

### VS Code Extension

Search for **Nexus** in the VS Code Extensions Marketplace.

To build and run from source:

```bash
git clone https://github.com/probaba328/cline.git
cd cline
bun install
cd apps/vscode
bun run build:webview   # builds the React UI (~15s)
bun esbuild.mjs         # bundles the extension
```

Then launch a development host:

```bash
DISPLAY=:1 code --no-sandbox \
  --user-data-dir=/tmp/vscode-userdata \
  --extensionDevelopmentPath=$(pwd)/apps/vscode \
  .
```

Click the Nexus icon in the Activity Bar to open the chat panel.

### CLI

```bash
# Run from source
bun run cli

# Interactive mode
bun run cli -i

# One-shot task
bun run cli "Add unit tests for the auth module"
```

Configure your provider credential once:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
bun run cli -i
```

---

## Desteklenen Diller / Supported Languages

Nexus 13 dili destekler. Arayüz dili, VS Code yerel ayarından (`vscode.env.language`) otomatik algılanır; İngilizce varsayılan olarak kullanılır.

Nexus ships with translations for 13 languages. The interface language is detected automatically from your VS Code locale (`vscode.env.language`), with English as the fallback.

| Dil | Kod | Durum | Katkıcı |
|-----|-----|-------|---------|
| English | `en` | ✅ Tamamlandı (kaynak) | @nexus |
| Türkçe | `tr` | ✅ Tamamlandı | @nexus |
| Deutsch | `de` | ✅ Tamamlandı | @nexus |
| Français | `fr` | ✅ Tamamlandı | @nexus |
| Español | `es` | ✅ Tamamlandı | @nexus |
| Português (Brasil) | `pt-BR` | ✅ Tamamlandı | @nexus |
| 日本語 | `ja` | ✅ Tamamlandı | @nexus |
| 한국어 | `ko` | ✅ Tamamlandı | @nexus |
| 中文 (简体) | `zh-CN` | ✅ Tamamlandı | @nexus |
| 中文 (繁體) | `zh-TW` | ✅ Tamamlandı | @nexus |
| العربية | `ar` | ✅ Tamamlandı | @nexus |
| Русский | `ru` | ✅ Tamamlandı | @nexus |
| हिन्दी | `hi` | ✅ Tamamlandı | @nexus |

Eksik bir dil mi var? → [Yeni dil talebi aç](https://github.com/probaba328/cline/issues/new?template=translation.yml) · [Çeviri Katkı Rehberi](./CONTRIBUTING_TRANSLATION.md)

---

## Çeviri Katkısı / Contributing Translations

Çeviri dosyaları `apps/vscode/webview-ui/src/i18n/locales/` dizininde bulunur.

**Mevcut çeviriyi iyileştirmek için:**

1. Repo'yu fork edin ve dilinizin dosyasını açın (örn. `fr.json`)
2. String değerlerini doldurun veya düzeltin — anahtarlar değiştirilmemelidir
3. `i18n: improve [Language] translation` başlıklı bir pull request açın

**Yeni dil eklemek için:**

1. `en.json` dosyasını kopyalayın, [BCP 47 etiketi](https://www.iana.org/assignments/language-subtag-registry) ile adlandırın (örn. `vi.json`)
2. `apps/vscode/webview-ui/src/i18n/index.ts` dosyasına kaydedin
3. `i18n: add [Language] translation` başlıklı bir pull request açın

Tam rehber: [CONTRIBUTING_TRANSLATION.md](./CONTRIBUTING_TRANSLATION.md)

---

## Supported AI Models

Nexus works with every major LLM provider out of the box. There is no preferred provider — use whatever model fits your workflow and budget.

| Provider | Notable models |
|----------|---------------|
| [Anthropic](https://anthropic.com) | Claude Opus, Sonnet, Haiku |
| [OpenAI](https://openai.com) | GPT-4o, o1, o3-mini |
| [Google](https://ai.google.dev) | Gemini 2.0 Flash, Gemini 2.5 Pro |
| [AWS Bedrock](https://aws.amazon.com/bedrock/) | Cross-region inference for Claude & Llama |
| [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) | Enterprise GPT-4o deployments |
| [OpenRouter](https://openrouter.ai) | 200+ models via a single API key |
| [Ollama](https://ollama.com) | Local models (Llama 3, Mistral, Phi, …) |
| [LM Studio](https://lmstudio.ai) | Local models with a GUI |
| [Requesty](https://requesty.ai) | Unified model gateway |
| [Groq](https://groq.com) | Ultra-fast inference |

Configure your provider in the Settings panel or via environment variables:

```bash
# Anthropic
export ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
export OPENAI_API_KEY=sk-...

# OpenRouter
export OPENROUTER_API_KEY=sk-or-...
```

---

## Security Policy

**API keys** are stored only in your OS keychain via VS Code SecretStorage. They are never logged, never written to disk as plain text, and never sent to Nexus-controlled servers.

**Telemetry** is opt-in and disabled by default. When enabled, only anonymous usage events are collected — no code, no prompts, no file paths, no personal data. You can disable telemetry at any time:

- **VS Code settings:** set `telemetry.telemetryLevel` to `off`
- **Nexus settings panel:** Settings → Usage & Error Reporting → Disable

**Network:** Nexus connects only to the AI provider endpoint you configure. No data is routed through Nexus infrastructure.

Full details: [SECURITY.md](./SECURITY.md) · Report a vulnerability: [security@nexus.bot](mailto:security@nexus.bot)

---

## Contributing

Contributions are welcome — bug fixes, new features, translations, and documentation improvements alike.

```bash
# 1. Fork and clone
git clone https://github.com/probaba328/cline.git
cd cline

# 2. Install dependencies (Bun required)
bun install

# 3. Build SDK packages (required before running tests)
bun run build:sdk

# 4. Create a feature branch
git checkout -b feat/my-feature

# 5. Make changes, then check types and lint
bun run check

# 6. Run tests
bun run test:unit

# 7. Push and open a pull request
git push origin feat/my-feature
```

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for commit message conventions and code style guidelines.

### Project structure

```
apps/
  cli/              CLI tool (@nexus/cli)
  vscode/           VS Code extension
    src/            Extension host (Node.js)
    webview-ui/     Chat panel UI (React)
  nexus-hub/        Hub daemon
sdk/
  packages/
    shared/         Shared types & utilities (@nexus/shared)
    llms/           LLM provider integrations (@nexus/llms)
    agents/         Stateless agent loop (@nexus/agents)
    core/           Session orchestration (@nexus/core)
    sdk/            Public SDK entry point (@nexus/sdk)
```

---

## License

[Apache 2.0](./LICENSE) — Nexus is a fork of [Cline](https://github.com/cline/cline), which is also Apache 2.0 licensed.
