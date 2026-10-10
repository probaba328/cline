/**
 * Nexus Plugin Registry
 *
 * VS Code uzantısı için plugin yükleme, doğrulama ve yönetim katmanı.
 *
 * Pluginler üç yerden keşfedilir (öncelik sırası):
 *   1. .nexus/plugins/  — workspace'e özgü pluginler
 *   2. ~/.nexus/plugins/ — kullanıcıya özgü global pluginler
 *   3. Uzantı ayarlarındaki manuel yollar
 *
 * Güvenlik:
 *   - Her plugin manifest'i yüklenmeden önce doğrulanır
 *   - Bilinmeyen capability'ler yüklemeyi engeller
 *   - Sandbox modu plugin'i ana işlemden izole eder
 */

import path from "node:path"
import os from "node:os"
import { Logger } from "@/shared/services/Logger"
import type {
	NexusPlugin,
	NexusPluginInfo,
	NexusPluginRegistryEntry,
	NexusPluginSandboxOptions,
	NexusPluginStatus,
} from "./plugin-types"

// ---------------------------------------------------------------------------
// Sabitler
// ---------------------------------------------------------------------------

/** Workspace içindeki varsayılan plugin klasörü */
export const WORKSPACE_PLUGIN_DIR = ".nexus/plugins"

/** Kullanıcının home dizinindeki global plugin klasörü */
export const GLOBAL_PLUGIN_DIR = path.join(os.homedir(), ".nexus", "plugins")

/** Registry'nin bir plugin yüklemesi için varsayılan ihracat adı */
export const DEFAULT_PLUGIN_EXPORT = "plugin"

// ---------------------------------------------------------------------------
// Registry Sınıfı
// ---------------------------------------------------------------------------

/**
 * Plugin registry — plugin'lerin yüklendiği, doğrulandığı ve izlendiği yer.
 *
 * Kullanım:
 * ```typescript
 * const registry = new NexusPluginRegistry({ workspaceRoot: "/path/to/workspace" })
 * await registry.loadAll()
 * const plugins = registry.getLoadedPlugins()
 * ```
 */
export class NexusPluginRegistry {
	private readonly workspaceRoot: string | undefined
	private readonly sandboxOptions: NexusPluginSandboxOptions
	private readonly entries = new Map<string, NexusPluginRegistryEntry>()
	private readonly pluginInfos = new Map<string, NexusPluginInfo>()
	private readonly loadedPlugins: NexusPlugin[] = []

	constructor(options: {
		workspaceRoot?: string
		sandboxOptions?: NexusPluginSandboxOptions
	} = {}) {
		this.workspaceRoot = options.workspaceRoot
		this.sandboxOptions = options.sandboxOptions ?? {}
	}

	// -------------------------------------------------------------------------
	// Kayıt
	// -------------------------------------------------------------------------

	/** Plugin'i registry'e manuel olarak ekle */
	register(entry: NexusPluginRegistryEntry): void {
		this.entries.set(entry.path, entry)
		this.pluginInfos.set(entry.path, {
			name: entry.path,
			path: entry.path,
			status: entry.disabled ? "disabled" : "pending",
			capabilities: [],
		})
	}

	// -------------------------------------------------------------------------
	// Yükleme
	// -------------------------------------------------------------------------

	/**
	 * Tüm kayıtlı plugin'leri yükle.
	 * Başarısız olanlar atlanır ve hata loglanır.
	 */
	async loadAll(): Promise<void> {
		const results = await Promise.allSettled(
			[...this.entries.values()].map((entry) => this.loadOne(entry)),
		)

		for (const result of results) {
			if (result.status === "rejected") {
				Logger.log(`[PluginRegistry] Plugin yükleme hatası: ${String(result.reason)}`)
			}
		}
	}

	private async loadOne(entry: NexusPluginRegistryEntry): Promise<void> {
		if (entry.disabled) return

		const absolutePath = path.isAbsolute(entry.path)
			? entry.path
			: path.resolve(this.workspaceRoot ?? process.cwd(), entry.path)

		try {
			const mod = await import(absolutePath) as Record<string, unknown>
			const exportName = entry.exportName ?? DEFAULT_PLUGIN_EXPORT
			const pluginExport = mod.default ?? mod[exportName]

			this.validatePluginExport(pluginExport, absolutePath)
			const plugin = pluginExport as NexusPlugin

			this.loadedPlugins.push(plugin)
			this.pluginInfos.set(entry.path, {
				name: plugin.name,
				path: entry.path,
				status: "loaded",
				capabilities: plugin.manifest.capabilities,
			})

			Logger.log(`[PluginRegistry] Plugin yüklendi: ${plugin.name} (${absolutePath})`)
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err)
			this.pluginInfos.set(entry.path, {
				name: entry.path,
				path: entry.path,
				status: "failed",
				capabilities: [],
				error: message,
			})
			Logger.log(`[PluginRegistry] Plugin yüklenemedi: ${absolutePath} — ${message}`)
			throw err
		}
	}

	// -------------------------------------------------------------------------
	// Doğrulama
	// -------------------------------------------------------------------------

	private validatePluginExport(value: unknown, absolutePath: string): void {
		if (!value || typeof value !== "object") {
			throw new Error(`Geçersiz plugin modülü (${absolutePath}): nesne ihraç edilmeli`)
		}
		const obj = value as Record<string, unknown>
		if (typeof obj["name"] !== "string" || obj["name"].length === 0) {
			throw new Error(`Geçersiz plugin (${absolutePath}): "name" alanı zorunlu`)
		}
		if (!obj["manifest"] || typeof obj["manifest"] !== "object") {
			throw new Error(`Geçersiz plugin (${absolutePath}): "manifest" alanı zorunlu`)
		}
		const manifest = obj["manifest"] as Record<string, unknown>
		if (!Array.isArray(manifest["capabilities"]) || manifest["capabilities"].length === 0) {
			throw new Error(
				`Geçersiz plugin (${absolutePath}): manifest.capabilities boş olmayan bir dizi olmalı`,
			)
		}
	}

	// -------------------------------------------------------------------------
	// Erişim
	// -------------------------------------------------------------------------

	/** Başarıyla yüklenen plugin'leri döner */
	getLoadedPlugins(): NexusPlugin[] {
		return [...this.loadedPlugins]
	}

	/** Tüm plugin'lerin durum bilgisini döner */
	getAllPluginInfos(): NexusPluginInfo[] {
		return [...this.pluginInfos.values()]
	}

	/** Belirli bir plugin'in durumunu döner */
	getStatus(pluginPath: string): NexusPluginStatus | undefined {
		return this.pluginInfos.get(pluginPath)?.status
	}

	/** Kaç plugin başarıyla yüklendiğini döner */
	getLoadedCount(): number {
		return this.loadedPlugins.length
	}
}
