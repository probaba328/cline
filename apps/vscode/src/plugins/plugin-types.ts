/**
 * Nexus VS Code Eklenti (Plugin) API
 *
 * Bu modül, Nexus'un VS Code uzantısı için plugin geliştirme arayüzlerini
 * tanımlar. @nexus/shared paketindeki temel SDK tipleri üzerine inşa edilmiştir.
 *
 * Plugin Yaşam Döngüsü:
 *   resolve → validate → setup → activate → run
 *
 * Yetki Sistemi (capabilities):
 *   - "tools"           : Agent'a yeni araçlar ekler (model çağırabilir)
 *   - "hooks"           : Yaşam döngüsü olaylarını dinler (beforeRun, afterTool, ...)
 *   - "commands"        : Slash komutları kaydeder (/my-command)
 *   - "rules"           : Her oturuma eklenen sistem prompt kuralları
 *   - "skills"          : Özel beceriler (tekrar kullanılabilir talimatlar)
 *   - "messageBuilders" : Mesajları gönderilmeden önce dönüştürür
 *   - "providers"       : Özel model sağlayıcı kaydeder
 *   - "automationEvents": Otomasyon olayları yayınlar/işler
 *   - "mcp"             : MCP (Model Context Protocol) sunucu kaydeder
 */

import type {
	AgentExtensionCapability,
	AgentExtensionApi,
	AgentExtensionHooks,
	PluginSetupContext,
	PluginManifest,
} from "@nexus/shared"

// ---------------------------------------------------------------------------
// Temel Plugin Arayüzü
// ---------------------------------------------------------------------------

/**
 * Nexus plugin'inin temel arayüzü.
 *
 * Her plugin bu arayüzü uygulamalıdır. `name` ve `manifest` zorunludur;
 * `setup()` ile yetenekler kayıt edilir, `hooks` ile yaşam döngüsü dinlenir.
 *
 * @example
 * ```typescript
 * import type { NexusPlugin } from "@/plugins/plugin-types"
 *
 * const plugin: NexusPlugin = {
 *   name: "kelime-sayaci",
 *   manifest: { capabilities: ["tools", "hooks"] },
 *   setup(api, ctx) {
 *     api.registerTool({ name: "say_words", ... })
 *   },
 *   hooks: {
 *     afterRun(ctx) { console.log("Oturum bitti:", ctx.agentId) }
 *   }
 * }
 * export const plugin = plugin
 * ```
 */
export interface NexusPlugin {
	/** Plugin'in benzersiz adı. Küçük harf, tire ile ayrılmış önerilir. */
	name: string

	/** Hangi yeteneklerin kullanılacağını bildiren manifest. Registry bu listeyi doğrular. */
	manifest: NexusPluginManifest

	/** Plugin devre dışı bırakıldığında registry tarafından atlanır. */
	disabled?: boolean

	/**
	 * Çalışma zamanı hook'ları. `manifest.capabilities` içinde `"hooks"` olmadan
	 * bu alan tanımlanırsa doğrulama hatası fırlatılır.
	 */
	hooks?: AgentExtensionHooks

	/**
	 * Plugin kurulum fonksiyonu. Registry tarafından bir kez çağrılır.
	 *
	 * `api` parametresi: araçları, komutları, kuralları kaydetmek için.
	 * `ctx` parametresi: workspace bilgisi, oturum, kullanıcı kimliği, logger.
	 *
	 * ctx.workspaceInfo?.rootPath — workspace kök dizini (process.cwd() yerine bunu kullan!)
	 */
	setup?: (api: AgentExtensionApi, ctx: PluginSetupContext) => void | Promise<void>
}

// ---------------------------------------------------------------------------
// Plugin Manifest
// ---------------------------------------------------------------------------

/**
 * Plugin manifest'i — plugin'in ne yapabileceğini bildirir.
 *
 * `capabilities`: izin verilen yetenekler listesi (zorunlu, boş olamaz)
 * `providerIds` : sadece belirli LLM sağlayıcılarında etkinleştir (isteğe bağlı)
 * `modelIds`    : sadece belirli modellerde etkinleştir (isteğe bağlı)
 */
export interface NexusPluginManifest extends PluginManifest {
	capabilities: AgentExtensionCapability[]
	providerIds?: string[]
	modelIds?: string[]
}

// ---------------------------------------------------------------------------
// Plugin Kayıt Girdisi (Registry)
// ---------------------------------------------------------------------------

/**
 * Plugin registry'deki bir girdi.
 * Her plugin kendi klasöründe veya tek dosyada tanımlanır.
 */
export interface NexusPluginRegistryEntry {
	/** Plugin dosya yolu (workspace'e göreli veya mutlak) */
	path: string
	/** Hangi ihracat adının plugin nesnesi olarak yükleneceği. Varsayılan: "plugin" */
	exportName?: string
	/** Devre dışı bırakmak için true yapın (dosya silinmeden) */
	disabled?: boolean
}

// ---------------------------------------------------------------------------
// Plugin Güvenlik Seçenekleri (Sandbox)
// ---------------------------------------------------------------------------

/**
 * Plugin sandbox çalışma zamanı ayarları.
 *
 * Nexus, pluginleri ayrı bir subprocess'te çalıştırabilir (sandboxed mod).
 * Bu mod plugin'i ana işlemden izole eder ve zaman aşımı sınırları uygular.
 */
export interface NexusPluginSandboxOptions {
	/**
	 * Sandbox modu aktif mi?
	 * - true  → plugin ayrı bir subprocess'te çalışır (izolasyon)
	 * - false → plugin ana işlemde (in-process) çalışır (performans)
	 * Varsayılan: false (VS Code uzantısı içinde in-process önerilir)
	 */
	sandboxed?: boolean

	/**
	 * Plugin modülünün import edilmesi için maksimum süre (ms).
	 * Varsayılan: 4000 ms
	 */
	importTimeoutMs?: number

	/**
	 * Hook çağrısı için maksimum süre (ms).
	 * Bu süreyi aşan hook çağrıları iptal edilir.
	 * Varsayılan: 5000 ms
	 */
	hookTimeoutMs?: number

	/**
	 * setup() ve katkı kayıtları için maksimum süre (ms).
	 * Varsayılan: 10000 ms
	 */
	contributionTimeoutMs?: number

	/**
	 * Atıl (çağrısız) kalma süresi sonrası subprocess'i kapat (ms).
	 * Varsayılan: 30 dakika
	 */
	idleTimeoutMs?: number
}

// ---------------------------------------------------------------------------
// Plugin İzin Sistemi
// ---------------------------------------------------------------------------

/**
 * Plugin'in hangi sistem kaynaklarına erişebileceğini kontrol eden izin seti.
 *
 * NOT: Detaylı kaynak erişimi (dosya sistemi, ağ) plugin'in tanımladığı
 * araçlar (tools) üzerinden agent'ın erişim politikası tarafından yönetilir.
 * Bu yapı metadata amaçlıdır; host tarafından enforced izinler
 * sandbox ve VS Code Extension Host kısıtlamaları aracılığıyla sağlanır.
 */
export interface NexusPluginPermissions {
	/**
	 * Dosya sistemi erişim izni.
	 * "readonly" → sadece okuma
	 * "workspace" → sadece workspace klasörü içinde yazma
	 * "unrestricted" → tam erişim (güvenilir pluginler için)
	 */
	filesystem?: "readonly" | "workspace" | "unrestricted"

	/**
	 * Ağ erişimi.
	 * false → ağ erişimi engellenir (sandbox modunda)
	 * true  → tüm ağ erişimine izin verilir
	 * string[] → sadece bu host'lara izin verilir
	 */
	network?: boolean | string[]

	/**
	 * Subprocess başlatma izni (örn. LSP sunucusu için).
	 * Varsayılan: false
	 */
	spawnProcesses?: boolean
}

// ---------------------------------------------------------------------------
// Plugin Durumu
// ---------------------------------------------------------------------------

/** Plugin'in yükleme/çalışma durumu */
export type NexusPluginStatus = "pending" | "loaded" | "failed" | "disabled"

/** Registry'nin bir plugin hakkında tuttuğu çalışma zamanı bilgisi */
export interface NexusPluginInfo {
	name: string
	path: string
	status: NexusPluginStatus
	capabilities: AgentExtensionCapability[]
	permissions?: NexusPluginPermissions
	error?: string
}
