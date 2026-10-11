import https from "node:https"
import http from "node:http"
import type { BYOKProviderId, BYOKValidationResult } from "../../shared/byok/types"
import { getBYOKProvider } from "../../shared/byok/catalog"
import { mapProviderError } from "../../shared/byok/validation"

const VALIDATION_TIMEOUT_MS = 10_000

interface MinimalRequest {
	hostname: string
	port?: number
	path: string
	method: string
	headers: Record<string, string>
	protocol: "https:" | "http:"
	body?: string
}

/**
 * Makes a lightweight test call to a provider endpoint to verify the API key works.
 *
 * Security constraints:
 * - API keys are NEVER logged — only used in the Authorization header.
 * - Errors shown to users never contain the API key or stack traces.
 * - Each call is stateless; no key is retained after the call returns.
 */
export class BYOKValidationService {
	/**
	 * Validates an API key by making a minimal API call to the provider.
	 * For local providers (Ollama, LM Studio), checks reachability instead.
	 */
	async validateKey(
		providerId: BYOKProviderId,
		apiKey: string,
		customEndpoint?: string,
	): Promise<BYOKValidationResult> {
		const provider = getBYOKProvider(providerId)
		if (!provider) {
			return { ok: false, message: "Bilinmeyen sağlayıcı", code: "unknown" }
		}

		if (provider.isLocal) {
			return this.checkLocalEndpoint(providerId, customEndpoint ?? provider.localEndpoint ?? "")
		}

		const req = this.buildValidationRequest(providerId, apiKey, customEndpoint)
		if (!req) {
			return { ok: false, message: "Bu sağlayıcı için doğrulama desteklenmiyor", code: "unknown" }
		}

		return this.makeRequest(providerId, req)
	}

	private buildValidationRequest(
		providerId: BYOKProviderId,
		apiKey: string,
		customEndpoint?: string,
	): MinimalRequest | null {
		switch (providerId) {
			case "anthropic":
				return {
					protocol: "https:",
					hostname: "api.anthropic.com",
					path: "/v1/models",
					method: "GET",
					headers: {
						"x-api-key": apiKey,
						"anthropic-version": "2023-06-01",
					},
				}

			case "openai":
				return {
					protocol: "https:",
					hostname: "api.openai.com",
					path: "/v1/models",
					method: "GET",
					headers: { Authorization: `Bearer ${apiKey}` },
				}

			case "google":
				return {
					protocol: "https:",
					hostname: "generativelanguage.googleapis.com",
					path: `/v1beta/models?key=${apiKey}`,
					method: "GET",
					headers: {},
				}

			case "groq":
				return {
					protocol: "https:",
					hostname: "api.groq.com",
					path: "/openai/v1/models",
					method: "GET",
					headers: { Authorization: `Bearer ${apiKey}` },
				}

			case "openrouter":
				return {
					protocol: "https:",
					hostname: "openrouter.ai",
					path: "/api/v1/models",
					method: "GET",
					headers: { Authorization: `Bearer ${apiKey}` },
				}

			case "openai-compatible": {
				if (!customEndpoint) return null
				const url = new URL("/v1/models", customEndpoint)
				return {
					protocol: url.protocol as "https:" | "http:",
					hostname: url.hostname,
					port: url.port ? parseInt(url.port) : undefined,
					path: url.pathname + url.search,
					method: "GET",
					headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
				}
			}

			default:
				return null
		}
	}

	private async checkLocalEndpoint(providerId: BYOKProviderId, endpoint: string): Promise<BYOKValidationResult> {
		if (!endpoint) {
			return { ok: false, message: "Endpoint URL girilmedi", code: "network_error" }
		}

		let url: URL
		try {
			url = new URL(providerId === "ollama" ? "/api/tags" : "/v1/models", endpoint)
		} catch {
			return { ok: false, message: "Geçersiz endpoint URL'si", code: "network_error" }
		}

		const req: MinimalRequest = {
			protocol: url.protocol as "https:" | "http:",
			hostname: url.hostname,
			port: url.port ? parseInt(url.port) : undefined,
			path: url.pathname,
			method: "GET",
			headers: {},
		}

		const result = await this.makeRequest(providerId, req)
		if (result.ok) {
			return { ok: true, message: "Servis çalışıyor ve erişilebilir" }
		}
		return {
			ok: false,
			message: `Servise bağlanılamadı — ${providerId === "ollama" ? "Ollama'nın çalıştığından emin olun" : "LM Studio'nun açık ve bir model yüklendiğinden emin olun"}`,
			code: "network_error",
		}
	}

	private makeRequest(providerId: BYOKProviderId, req: MinimalRequest): Promise<BYOKValidationResult> {
		return new Promise((resolve) => {
			const transport = req.protocol === "https:" ? https : http
			const timeout = setTimeout(() => {
				nodeReq.destroy()
				resolve({
					ok: false,
					message: "Bağlantı zaman aşımına uğradı (10s). İnternet bağlantınızı kontrol edin.",
					code: "network_error",
				})
			}, VALIDATION_TIMEOUT_MS)

			const options: http.RequestOptions = {
				hostname: req.hostname,
				port: req.port,
				path: req.path,
				method: req.method,
				headers: req.headers,
			}

			const nodeReq = transport.request(options, (res) => {
				clearTimeout(timeout)
				let body = ""
				res.on("data", (chunk: Buffer) => {
					body += chunk.toString()
					if (body.length > 4096) res.destroy()
				})
				res.on("end", () => {
					if (res.statusCode && res.statusCode < 400) {
						resolve({ ok: true, message: "API key geçerli ve aktif" })
					} else {
						resolve(mapProviderError(providerId, res.statusCode ?? null, body))
					}
				})
			})

			nodeReq.on("error", (err: NodeJS.ErrnoException) => {
				clearTimeout(timeout)
				if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
					resolve({
						ok: false,
						message: "Sunucuya bağlanılamadı. İnternet bağlantınızı veya endpoint URL'sini kontrol edin.",
						code: "network_error",
					})
				} else {
					resolve({ ok: false, message: "Ağ hatası oluştu.", code: "network_error" })
				}
			})

			if (req.body) nodeReq.write(req.body)
			nodeReq.end()
		})
	}
}
