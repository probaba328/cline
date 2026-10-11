# Nexus Plugin Geliştirme Rehberi

Nexus'un plugin sistemi, agent davranışını genişletmenizi sağlar. Bu rehber, Türkçe olarak
plugin geliştirmeyi adım adım anlatır.

---

## İçindekiler

- [Plugin Nedir?](#plugin-nedir)
- [Plugin API](#plugin-api)
- [Yaşam Döngüsü](#yaşam-döngüsü)
- [Yetenek Sistemi](#yetenek-sistemi)
- [Plugin Yazma](#plugin-yazma)
- [Plugin Kayıt Dosyası](#plugin-kayıt-dosyası)
- [Güvenlik ve Sandbox](#güvenlik-ve-sandbox)
- [Plugin Kurulumu](#plugin-kurulumu)
- [API Referansı](#api-referansı)

---

## Plugin Nedir?

Bir Nexus plugin'i, agent'a yeni yetenekler ekleyen bir TypeScript/JavaScript modülüdür.
Plugin, agent'ın her çalıştırılmasına dahil edilen bir nesne ihraç eder:

```typescript
import type { AgentPlugin } from "@nexus/core"

const plugin: AgentPlugin = {
  name: "benim-pluginim",
  manifest: {
    capabilities: ["tools", "hooks"],
  },
  setup(api, ctx) {
    // Araçları, komutları ve kuralları kaydet
  },
  hooks: {
    afterRun(ctx) {
      // Oturum bittiğinde çalış
    },
  },
}

export { plugin }
```

Plugin'ler şunları yapabilir:

| Yetenek | Açıklama |
|---------|----------|
| **Araç (tool)** | Model'in çağırabileceği yeni fonksiyonlar ekler |
| **Komut (command)** | `/komut-adı` şeklinde slash komutları ekler |
| **Kural (rule)** | Her oturumdaki sistem prompt'una kural ekler |
| **Hook** | Agent yaşam döngüsü olaylarını dinler |
| **Sağlayıcı (provider)** | Özel model sağlayıcısı kaydeder |
| **MCP sunucusu** | Model Context Protocol sunucusu ekler |

---

## Plugin API

Plugin, `setup(api, ctx)` fonksiyonu aracılığıyla kayıt işlemlerini gerçekleştirir.

### `api` — Kayıt Arayüzü

```typescript
interface AgentExtensionApi {
  // Capability: "tools" — Model tarafından çağrılabilir araç ekle
  registerTool(tool: AgentTool): void

  // Capability: "commands" — Slash komutu ekle
  registerCommand(command: AgentExtensionCommand): void

  // Capability: "rules" — Sistem prompt'una kural ekle
  registerRule(rule: AgentExtensionRule): void

  // Capability: "messageBuilders" — Mesaj dönüştürücü ekle
  registerMessageBuilder(builder: AgentExtensionMessageBuilder): void

  // Capability: "providers" — Model sağlayıcısı ekle
  registerProvider(provider: AgentExtensionProvider): void

  // Capability: "automationEvents" — Otomasyon olay tipi kaydet
  registerAutomationEventType(eventType: AgentExtensionAutomationEventType): void

  // Capability: "mcp" — MCP sunucusu kaydet
  registerMcpServer(server: AgentExtensionMcpServer): void
}
```

### `ctx` — Workspace ve Oturum Bağlamı

```typescript
interface PluginSetupContext {
  // Workspace ve git bilgisi (process.cwd() yerine bunu kullan!)
  workspaceInfo?: {
    rootPath: string              // Workspace kök dizini
    latestGitBranchName?: string  // Aktif git branch
    latestGitCommitHash?: string  // Son commit hash
    associatedRemoteUrls?: string[] // Remote URL'leri
  }

  // Oturum kimliği
  session?: { sessionId?: string }

  // İstemci bilgisi (vscode, cli, sdk)
  client?: { name: string; version?: string; platform?: string }

  // Kullanıcı kimliği
  user?: { email?: string; organizationId?: string }

  // Loglama
  logger?: { info(msg: string): void; error(msg: string): void }

  // Telemetri (opsiyonel — her zaman feature-detect et)
  telemetry?: ITelemetryService
}
```

> **Önemli:** Dosya yolları için her zaman `ctx.workspaceInfo?.rootPath` kullan.
> `process.cwd()` veya `import.meta.url` çalışma dizinine bağlı olduğundan
> `--cwd` bayrağı ile çalışıldığında yanlış sonuç verebilir.

---

## Yaşam Döngüsü

Plugin registry şu aşamaları sırayla çalıştırır:

```
resolve → validate → setup → activate → run
```

| Aşama | Açıklama |
|-------|----------|
| **resolve** | Pluginler yüklenir, normalize edilir |
| **validate** | Manifest doğrulanır, capability'ler kontrol edilir |
| **setup** | `setup(api, ctx)` çağrılır; araçlar, kurallar kayıt edilir |
| **activate** | Registry kilitlenir; artık kayıt kabul edilmez |
| **run** | Her agent çalıştırması; hook'lar tetiklenir |

### Hook'lar

`hooks` nesnesi, agent'ın yaşam döngüsü olaylarını dinler.
Hook kullanmak için manifest'te `"hooks"` capability'si **zorunludur**.

```typescript
hooks: {
  // Oturum başlamadan önce
  beforeRun(ctx: { agentId: string; conversationId: string }) { }

  // Oturum bittikten sonra
  afterRun(ctx: { agentId: string; result: string }) { }

  // Model'e istek gönderilmeden önce
  beforeModel(ctx: { messages: Message[] }) { }

  // Model'den yanıt alındıktan sonra
  afterModel(ctx: { response: Message }) { }

  // Araç çağrısından önce — { skip: true } dönerek araçı engelle
  beforeTool(ctx: { tool: { name: string; input: unknown } }): { skip?: boolean } | void { }

  // Araç çağrısından sonra
  afterTool(ctx: { tool: { name: string }; result: unknown }) { }

  // Herhangi bir iç olay
  onEvent(event: { type: string; payload?: unknown }) { }
}
```

---

## Yetenek Sistemi

Manifest'teki `capabilities` dizisi, plugin'in **ne yapabileceğini** bildirir.
Registry, bildirilen yetenek ile gerçek kullanımı karşılaştırır.

```typescript
manifest: {
  capabilities: ["tools", "hooks"],
  // Sadece şu sağlayıcılarda aktif ol (isteğe bağlı):
  providerIds: ["anthropic", "openai"],
  // Sadece şu modellerde aktif ol (isteğe bağlı):
  modelIds: ["claude-sonnet-4-5"],
}
```

Hatalı kullanım örnekleri (doğrulama hatası fırlatır):

```typescript
// HATA: "rules" bildirilmedi ama registerRule() çağrıldı
manifest: { capabilities: ["tools"] }
setup(api) {
  api.registerRule({ id: "r1", content: "..." }) // ← ValidationError
}

// HATA: "hooks" bildirilmedi ama hooks tanımlandı
manifest: { capabilities: ["tools"] }
hooks: { afterRun() {} }  // ← ValidationError
```

---

## Plugin Yazma

### 1. Minimal Plugin (Tek Araç)

```typescript
import { type AgentPlugin, createTool } from "@nexus/core"

const plugin: AgentPlugin = {
  name: "benim-araçım",
  manifest: { capabilities: ["tools"] },
  setup(api, ctx) {
    api.registerTool(
      createTool({
        name: "selamla",
        description: "Kullanıcıyı selamlar",
        inputSchema: {
          type: "object",
          properties: {
            isim: { type: "string", description: "Selamlanacak kişinin adı" },
          },
          required: ["isim"],
        },
        execute: async ({ isim }: { isim: string }) => {
          return `Merhaba, ${isim}!`
        },
      }),
    )
  },
}

export { plugin }
```

### 2. Hook + Araç + Kural

```typescript
import { type AgentPlugin, createTool } from "@nexus/core"

let runCount = 0

const plugin: AgentPlugin = {
  name: "istatistik-toplayici",
  manifest: { capabilities: ["tools", "hooks", "rules"] },

  setup(api, ctx) {
    api.registerRule({
      id: "istatistik-kural",
      content: "Her cevap sonunda araç kullanım sayısını belirt.",
    })

    api.registerTool(
      createTool({
        name: "oturum_istatistikleri",
        description: "Bu oturumdaki çalışma sayısını döner",
        inputSchema: { type: "object", properties: {} },
        execute: async () => `Toplam çalışma: ${runCount}`,
      }),
    )
  },

  hooks: {
    beforeRun() { runCount++ },
  },
}

export { plugin }
```

### 3. Slash Komutu

```typescript
const plugin: AgentPlugin = {
  name: "notlar",
  manifest: { capabilities: ["commands"] },
  setup(api) {
    api.registerCommand({
      name: "not-ekle",
      description: "Oturum notlarına bir not ekler",
      handler: (input: string) => ({
        reply: `Not eklendi: "${input}"`,
        submitPrompt: `Bunu hatırla: ${input}`,
      }),
    })
  },
}
```

---

## Plugin Kayıt Dosyası

Plugin'ler üç yerden otomatik keşfedilir:

| Konum | Kapsam |
|-------|--------|
| `.nexus/plugins/` | Workspace'e özgü |
| `~/.nexus/plugins/` | Kullanıcıya özgü (global) |
| `package.json` `nexus.plugins` dizisi | Proje bağımlılığı olarak |

### `package.json` Entegrasyonu

Plugin'i bir npm paketi olarak yazıyorsanız `package.json`'a ekle:

```json
{
  "name": "nexus-plugin-kelime-sayaci",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "nexus": {
    "plugins": ["./dist/index.js"]
  }
}
```

### Plugin Klasör Yapısı

```
nexus-plugin-kelime-sayaci/
├── package.json           ← name, version, nexus.plugins
├── index.ts               ← plugin tanımı, export { plugin }
├── README.md              ← kullanım kılavuzu
└── tsconfig.json          ← TypeScript yapılandırması
```

---

## Güvenlik ve Sandbox

### Sandbox Modu

Nexus, plugin'leri **iki modda** çalıştırabilir:

#### In-Process (Varsayılan)
Plugin, ana işlemle aynı Node.js sürecinde çalışır.

- ✅ Performanslı
- ✅ Düşük gecikme
- ⚠️ Ana işlemle aynı bellek alanını paylaşır

#### Sandboxed (İzole)
Plugin, ayrı bir subprocess'te çalışır; iletişim JSON IPC üzerinden kurulur.

- ✅ Ana işlemden tamamen izole
- ✅ Çökme durumunda ana işlemi etkilemez
- ✅ Zaman aşımı limitleri uygulanır
- ⚠️ Hook çağrıları ve araç sonuçları JSON üzerinden iletilir

Sandbox modunu CLI ile etkinleştirmek için `nexus.json` ayar dosyasına ekle:

```json
{
  "plugins": {
    "sandbox": true,
    "importTimeoutMs": 4000,
    "hookTimeoutMs": 5000
  }
}
```

### Erişim Sınırları

Plugin güvenliği birden fazla katmanda sağlanır:

1. **Manifest doğrulaması** — Bildirilmemiş capability'ler kullanılamaz.

2. **Araç politikası** — Plugin'in araçları, VS Code'un onay/ret mekanizmasına tabidir.
   Kullanıcı, her araç çağrısını onaylayabilir ya da reddedebilir.

3. **Sandbox zaman aşımı** — Sandbox modunda hook ve araç çağrıları için zaman sınırı:
   - Import: 4000 ms (varsayılan)
   - Hook: 5000 ms (varsayılan)
   - Katkı (setup): 10000 ms (varsayılan)

4. **Ağ erişimi** — Plugin'in ağ erişimi, VS Code Extension Host'un izin sistemine tabidir.
   Sandbox modunda ağ istekleri JSON IPC köprüsü üzerinden yönlendirilir.

5. **Dosya sistemi** — Plugin araçlarının dosya sistemi erişimi, agent'ın güvenlik
   politikasına (`.nexus/` içindeki `allowedDirectories` ve `gitignore` kuralları) tabidir.

> **Güvenlik İpucu:** Güvenilmeyen kaynaklardan plugin yüklemekten kaçının.
> Plugin'in kaynak kodunu incelemeden çalıştırmayın.

---

## Plugin Kurulumu

### CLI ile Kurulum

```bash
# Yerel dosyadan (workspace'e özgü):
nexus plugin install ./benim-pluginim.ts

# URL'den:
nexus plugin install https://github.com/kullanici/nexus-plugin-ornek/blob/main/index.ts

# npm paketinden:
nexus plugin install nexus-plugin-kelime-sayaci

# Global (tüm workspace'lerde kullanılabilir):
nexus plugin install nexus-plugin-kelime-sayaci --global
```

### Kurulu Plugin'leri Listele

```bash
nexus plugin list
nexus plugin list --global
```

### Plugin'i Kaldır

```bash
nexus plugin uninstall nexus-plugin-kelime-sayaci
```

### VS Code Ayarları

VS Code eklentisi üzerinden plugin eklemek için `settings.json`'a ekle:

```json
{
  "nexus.plugins": [
    "./plugins/benim-pluginim.ts",
    "~/.nexus/plugins/global-plugin.js"
  ]
}
```

---

## API Referansı

### `createTool(config)`

`@nexus/core` paketinden `createTool` yardımcısı:

```typescript
import { createTool } from "@nexus/core"

const arac = createTool({
  name: "arac_adi",             // Zorunlu: araç adı (snake_case önerilir)
  description: "Aracın amacı", // Zorunlu: model için açıklama
  inputSchema: {                // Zorunlu: JSON Schema (araç parametreleri)
    type: "object",
    properties: {
      parametre: { type: "string", description: "..." },
    },
    required: ["parametre"],
  },
  execute: async (input) => {   // Zorunlu: araç yürütme fonksiyonu
    // string, object veya Buffer döner
    return "sonuç"
  },
})
```

### `AgentExtensionCommand`

```typescript
api.registerCommand({
  name: "komut-adi",           // Slash komutunun adı (/komut-adi)
  description: "Ne yapar",     // İsteğe bağlı: açıklama
  handler: (input: string) => {
    return {
      reply: "Kullanıcıya gösterilen yanıt",
      submitPrompt: "Agent'a gönderilecek prompt (isteğe bağlı)",
    }
  },
})
```

### `AgentExtensionRule`

```typescript
api.registerRule({
  id: "benzersiz-kural-id",    // Zorunlu: benzersiz tanımlayıcı
  content: "Kural metni ya da dinamik fonksiyon",
  // Sadece belirtilen araç varsa kuralı ekle (isteğe bağlı):
  whenToolAvailable: "arac_adi",
})
```

### Hook Bağlamları

```typescript
hooks: {
  beforeRun(ctx: {
    agentId: string
    conversationId: string
    logger?: BasicLogger
  }): void | Promise<void>

  afterRun(ctx: {
    agentId: string
    result?: string
    error?: Error
    logger?: BasicLogger
  }): void | Promise<void>

  beforeTool(ctx: {
    tool: { name: string; input: unknown }
    agentId: string
  }): { skip?: boolean } | void | Promise<{ skip?: boolean } | void>

  afterTool(ctx: {
    tool: { name: string; input: unknown }
    result: unknown
    error?: Error
    agentId: string
  }): void | Promise<void>
}
```

---

## Örnek Projeler

| Proje | Açıklama |
|-------|----------|
| [`word-counter.ts`](../sdk/examples/plugins/word-counter.ts) | Kelime sayacı — araç + hook + kural (bu rehberin referans örneği) |
| [`weather-metrics.ts`](../sdk/examples/plugins/weather-metrics.ts) | Hava durumu araçları + performans metrikleri |
| [`gitignore-read-files-guard.ts`](../sdk/examples/plugins/gitignore-read-files-guard.ts) | `.gitignore` dışındaki dosyaları okuyan araçları engeller |
| [`web-search.ts`](../sdk/examples/plugins/web-search.ts) | Exa API ile web arama aracı |
| [`mac-notify.ts`](../sdk/examples/plugins/mac-notify.ts) | macOS bildirim sistemi entegrasyonu |

Tüm örnekler: `sdk/examples/plugins/`
