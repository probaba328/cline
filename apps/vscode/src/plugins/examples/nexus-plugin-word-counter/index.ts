/**
 * nexus-plugin-word-counter
 *
 * Nexus SDK plugin sistemi için minimal kelime sayacı örneği.
 * Bu dosyayı kopyalayarak kendi plugin'inizi geliştirin.
 *
 * Kurulum (CLI):
 *   nexus plugin install ./nexus-plugin-word-counter
 *
 * Kullanım:
 *   nexus -i "README.md dosyasındaki kelime sayısı kaç?"
 *
 * NOT: Bu dosya bir şablon/referans olarak buraya eklenmiştir.
 * Gerçek kullanım için `@nexus/core` bağımlılığı gereklidir.
 * Çalıştırılabilir tam örnek: sdk/examples/plugins/word-counter.ts
 */

// Plugin arayüzü — @nexus/core'dan gelir
interface AgentPlugin {
	name: string
	manifest: { capabilities: string[]; providerIds?: string[]; modelIds?: string[] }
	disabled?: boolean
	hooks?: Record<string, (...args: unknown[]) => unknown>
	setup?: (api: unknown, ctx: unknown) => void | Promise<void>
}

// createTool yardımcısı — @nexus/core'dan gelir
// Gerçek kullanımda: import { createTool } from "@nexus/core"
declare function createTool(config: {
	name: string
	description: string
	inputSchema: { type: string; properties: Record<string, unknown>; required?: string[] }
	execute: (input: Record<string, string>) => Promise<string>
}): unknown

import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

// ---------------------------------------------------------------------------
// Plugin Tanımı
// ---------------------------------------------------------------------------

const plugin: AgentPlugin = {
	name: "nexus-plugin-word-counter",

	manifest: {
		/**
		 * Bu plugin'in kullandığı yetenekler.
		 * Kullanılmayan yetenek buraya eklenmez — doğrulama başarısız olur.
		 *
		 * Geçerli değerler:
		 *   "tools"            — model tarafından çağrılabilir araçlar
		 *   "hooks"            — yaşam döngüsü olayları
		 *   "commands"         — slash komutları (/command-name)
		 *   "rules"            — sistem prompt'una eklenen kurallar
		 *   "skills"           — tekrar kullanılabilir talimat dosyaları
		 *   "messageBuilders"  — mesaj dönüştürücüler
		 *   "providers"        — özel model sağlayıcılar
		 *   "automationEvents" — otomasyon olayları
		 *   "mcp"              — MCP sunucuları
		 */
		capabilities: ["tools"],
	},

	// -------------------------------------------------------------------------
	// setup(api, ctx) — Plugin kurulum fonksiyonu
	//
	// Araçları, komutları ve kuralları burada kaydet.
	// ctx.workspaceInfo?.rootPath — workspace kök dizini (process.cwd() kullanma!)
	// -------------------------------------------------------------------------
	setup(api: unknown, ctx: unknown) {
		const typedCtx = ctx as { workspaceInfo?: { rootPath?: string } }
		const workspaceRoot = typedCtx.workspaceInfo?.rootPath
		const typedApi = api as {
			registerTool: (tool: unknown) => void
		}

		// Not: Gerçek projede `createTool` importunu @nexus/core'dan yap
		typedApi.registerTool({
			name: "count_words",
			description: "Bir dosyanın kelime sayısını döner",
			inputSchema: {
				type: "object",
				properties: {
					file_path: {
						type: "string",
						description: "Dosya yolu (workspace'e göreli)",
					},
				},
				required: ["file_path"],
			},
			execute: async ({ file_path }: { file_path: string }) => {
				const absolutePath = workspaceRoot
					? resolve(workspaceRoot, file_path)
					: resolve(file_path)

				const content = await readFile(absolutePath, "utf-8")
				const words = content.trim().split(/\s+/).filter(Boolean).length
				const chars = content.length
				const lines = content.split("\n").length

				return JSON.stringify({ file_path, words, chars, lines }, null, 2)
			},
		})
	},
}

// Nexus plugin yükleyicisinin beklediği ihracat formatı:
export { plugin }
export default plugin
