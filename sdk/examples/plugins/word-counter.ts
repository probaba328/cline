/**
 * Kelime Sayacı Plugin — Örnek Nexus Plugin
 *
 * Bu plugin, Nexus SDK'nın plugin sistemini öğrenmek için tasarlanmış
 * minimal ama tam özellikli bir örnektir. Şunları gösterir:
 *
 *   - Tool kaydı (api.registerTool)
 *   - Slash komut kaydı (api.registerCommand)
 *   - Sistem prompt kuralı ekleme (api.registerRule)
 *   - Yaşam döngüsü hook'ları (hooks.beforeRun, hooks.afterTool, hooks.afterRun)
 *   - Workspace context kullanımı (ctx.workspaceInfo)
 *   - Logger kullanımı (ctx.logger)
 *
 * Plugin kurulumu (CLI):
 *   nexus plugin install ./word-counter.ts --cwd .
 *   nexus -i "Bu dosyadaki kelime sayısını öğrenmek istiyorum"
 *
 * Direkt çalıştırma:
 *   ANTHROPIC_API_KEY=sk-... bun run examples/plugins/word-counter.ts
 */

import { type AgentPlugin, createTool } from "@nexus/core"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

// ---------------------------------------------------------------------------
// Plugin Seviyesi Durum
// (setup() sonrası tüm hook ve tool'lar tarafından erişilir)
// ---------------------------------------------------------------------------

let workspaceRoot: string | undefined
let sessionStartTime: number
let toolCallCount = 0
let totalWordsProcessed = 0

// ---------------------------------------------------------------------------
// Plugin Tanımı
// ---------------------------------------------------------------------------

const wordCounterPlugin: AgentPlugin = {
	name: "kelime-sayaci",

	manifest: {
		// Kullanılan yetenekleri listele — registry bu listeyi doğrular.
		// Listelenmemiş bir yetenek kullanılırsa setup() hata fırlatır.
		capabilities: ["tools", "commands", "rules", "hooks"],
	},

	// -------------------------------------------------------------------------
	// setup(api, ctx)
	//
	// Registry tarafından bir kez çağrılır. Araçları, komutları ve kuralları
	// burada kaydet.
	//
	// ÖNEMLI: Dosya yolları için ctx.workspaceInfo?.rootPath kullan,
	// process.cwd() veya import.meta.url kullanma — --cwd bayrağı ile
	// başlatıldığında yanlış sonuç verebilir.
	// -------------------------------------------------------------------------
	setup(api, ctx) {
		workspaceRoot = ctx.workspaceInfo?.rootPath
		const logger = ctx.logger

		const workspaceSuffix = workspaceRoot ? ` (workspace: ${workspaceRoot})` : ""

		// ---- Araç: Metin Kelime Sayacı ----------------------------------------
		api.registerTool(
			createTool({
				name: "count_words_in_text",
				description: `Verilen metnin kelime, karakter ve cümle sayısını hesaplar${workspaceSuffix}`,
				inputSchema: {
					type: "object" as const,
					properties: {
						text: {
							type: "string",
							description: "Analiz edilecek metin",
						},
						include_stats: {
							type: "boolean",
							description: "Ek istatistikler göster (ortalama kelime uzunluğu, en uzun kelime)",
						},
					},
					required: ["text"],
				},
				execute: async ({ text, include_stats }: { text: string; include_stats?: boolean }) => {
					toolCallCount++
					const result = analyzeText(text, include_stats ?? false)
					totalWordsProcessed += result.wordCount
					logger?.info?.(`[kelime-sayaci] Analiz tamamlandı: ${result.wordCount} kelime`)
					return JSON.stringify(result, null, 2)
				},
			}),
		)

		// ---- Araç: Dosya Kelime Sayacı -----------------------------------------
		api.registerTool(
			createTool({
				name: "count_words_in_file",
				description: `Bir dosyanın kelime sayısını ve istatistiklerini döner${workspaceSuffix}`,
				inputSchema: {
					type: "object" as const,
					properties: {
						file_path: {
							type: "string",
							description: "Analiz edilecek dosyanın yolu (workspace'e göreli)",
						},
					},
					required: ["file_path"],
				},
				execute: async ({ file_path }: { file_path: string }) => {
					toolCallCount++
					const absolutePath = workspaceRoot
						? resolve(workspaceRoot, file_path)
						: resolve(file_path)

					try {
						const content = await readFile(absolutePath, "utf-8")
						const result = analyzeText(content, true)
						result.filePath = file_path
						totalWordsProcessed += result.wordCount
						logger?.info?.(`[kelime-sayaci] Dosya analiz edildi: ${file_path} — ${result.wordCount} kelime`)
						return JSON.stringify(result, null, 2)
					} catch (err) {
						const message = err instanceof Error ? err.message : String(err)
						return JSON.stringify({ error: `Dosya okunamadı: ${message}` })
					}
				},
			}),
		)

		// ---- Slash Komutu: /kelime-sayaci-rapor --------------------------------
		api.registerCommand({
			name: "kelime-sayaci-rapor",
			description: "Bu oturumdaki kelime sayacı istatistiklerini göster",
			handler: () => {
				return {
					reply: [
						`**Kelime Sayacı Oturum Raporu**`,
						`- Toplam araç çağrısı: ${toolCallCount}`,
						`- Toplam işlenen kelime: ${totalWordsProcessed}`,
						`- Oturum süresi: ${Math.round((Date.now() - sessionStartTime) / 1000)} saniye`,
					].join("\n"),
				}
			},
		})

		// ---- Sistem Prompt Kuralı ----------------------------------------------
		api.registerRule({
			id: "kelime-sayaci-kural",
			content: [
				"Kelime sayma ve metin analizi işlemleri için `count_words_in_text` veya",
				"`count_words_in_file` araçlarını kullan.",
				"Kelime sayısı sorulduğunda tahmin etme, aracı çalıştır.",
			].join(" "),
		})
	},

	// -------------------------------------------------------------------------
	// Hooks — Yaşam Döngüsü Olayları
	//
	// "hooks" capability'si manifest'te bildirilmeden hooks tanımlanamaz.
	// Hook'lar setup() tamamlandıktan sonra her agent çalıştırmasında tetiklenir.
	// -------------------------------------------------------------------------
	hooks: {
		/** Her agent oturumu başladığında çağrılır */
		beforeRun(ctx) {
			sessionStartTime = Date.now()
			toolCallCount = 0
			totalWordsProcessed = 0
		},

		/** Her araç çağrısından sonra çağrılır — kelime sayacı araçlarını izle */
		afterTool(ctx) {
			if (
				ctx.tool.name === "count_words_in_text" ||
				ctx.tool.name === "count_words_in_file"
			) {
				// Araç çıktısını gözlemle (okuma amaçlı, değiştirme değil)
			}
		},

		/** Oturum bittiğinde çağrılır — özet logla */
		afterRun(ctx) {
			const duration = Math.round((Date.now() - sessionStartTime) / 1000)
			if (toolCallCount > 0) {
				ctx.logger?.info?.(
					`[kelime-sayaci] Oturum bitti — ${toolCallCount} araç çağrısı, ` +
						`${totalWordsProcessed} kelime işlendi, ${duration}s`,
				)
			}
		},
	},
}

// ---------------------------------------------------------------------------
// Metin Analiz Yardımcısı
// ---------------------------------------------------------------------------

interface TextAnalysisResult {
	wordCount: number
	characterCount: number
	characterCountNoSpaces: number
	sentenceCount: number
	paragraphCount: number
	averageWordLength?: number
	longestWord?: string
	filePath?: string
}

function analyzeText(text: string, includeStats: boolean): TextAnalysisResult {
	const words = text.trim().split(/\s+/).filter((w) => w.length > 0)
	const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
	const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

	const result: TextAnalysisResult = {
		wordCount: words.length,
		characterCount: text.length,
		characterCountNoSpaces: text.replace(/\s/g, "").length,
		sentenceCount: sentences.length,
		paragraphCount: paragraphs.length,
	}

	if (includeStats && words.length > 0) {
		const totalLength = words.reduce((sum, w) => sum + w.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, "").length, 0)
		result.averageWordLength = Math.round((totalLength / words.length) * 10) / 10
		result.longestWord = words.reduce((longest, w) => (w.length > longest.length ? w : longest), "")
	}

	return result
}

// ---------------------------------------------------------------------------
// Direkt Çalıştırma (bun run word-counter.ts)
// ---------------------------------------------------------------------------

if (import.meta.main) {
	const { NexusCore } = await import("@nexus/core")
	const nexus = new NexusCore()
	await nexus.start({
		prompt: "Bu metindeki kelime sayısını söyle: 'Merhaba dünya! Bu bir test metnidir. Kelime sayısı önemlidir.'",
		config: {
			apiProvider: "anthropic",
			apiModelId: "claude-sonnet-4-5",
			extensions: [wordCounterPlugin],
		},
	})
}

export const plugin = wordCounterPlugin
export default wordCounterPlugin
