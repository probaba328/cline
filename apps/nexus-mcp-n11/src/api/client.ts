import { N11ApiError, type N11Config, type N11Auth } from "../types/n11.js"

const BASE_URL = "https://api.n11.com/ws"

// N11 dokümante edilmiş rate limit yok; koruyucu olarak 5 req/sn
const RATE_LIMIT_PER_SEC = 5
const MAX_RETRIES = 4

export class N11Client {
	private readonly baseUrl: string
	readonly auth: N11Auth

	/** Son 1 saniyelik istek zaman damgaları */
	private requestTimestamps: number[] = []

	constructor(config: N11Config) {
		this.baseUrl = (config.baseUrl ?? BASE_URL).replace(/\/$/, "")
		// Credentials bellekte saklanır, hiçbir log'a yazılmaz
		this.auth = {
			appKey: config.apiKey,
			appSecret: config.apiSecret,
		}
	}

	// ── Core Request ───────────────────────────────────────────────────────────

	async request<T>(
		method: "GET" | "POST",
		path: string,
		body?: Record<string, unknown>,
		attempt = 1,
	): Promise<T> {
		await this.throttle()

		// N11 REST API: auth her istekte body ya da header'a eklenir
		const payload: Record<string, unknown> = {
			auth: this.auth,
			...(body ?? {}),
		}

		const url = `${this.baseUrl}${path}`
		let res: Response
		try {
			res = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					"User-Agent": "nexus-mcp-n11/1.0",
				},
				body: method === "POST" ? JSON.stringify(payload) : undefined,
				signal: AbortSignal.timeout(30_000),
			})
		} catch {
			throw new N11ApiError(
				"N11 servisi yanıt vermiyor. İnternet bağlantınızı kontrol edin.",
				0,
				"server_error",
			)
		}

		if (res.status === 401 || res.status === 403) {
			throw new N11ApiError(
				"API bilgilerin hatalı. n11.com → Mağazam → API Bilgileri sayfasını kontrol et.",
				res.status,
				"unauthorized",
			)
		}

		if (res.status === 404) {
			throw new N11ApiError(
				"Kaynak bulunamadı. Parametre değerlerini kontrol et.",
				404,
				"not_found",
			)
		}

		if (res.status === 429) {
			if (attempt > MAX_RETRIES) {
				throw new N11ApiError(
					`Rate limit aşıldı. ${MAX_RETRIES} denemeden sonra başarısız.`,
					429,
					"rate_limit",
				)
			}
			const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 300
			await sleep(backoff)
			return this.request<T>(method, path, body, attempt + 1)
		}

		if (res.status >= 500) {
			if (attempt <= 2) {
				await sleep(Math.pow(2, attempt) * 1500)
				return this.request<T>(method, path, body, attempt + 1)
			}
			throw new N11ApiError(
				"N11 servisi şu an yanıt vermiyor. Tekrar dene.",
				res.status,
				"server_error",
			)
		}

		if (!res.ok) {
			const text = await res.text().catch(() => "")
			throw new N11ApiError(`Hata ${res.status}: ${truncateSafe(text)}`, res.status, "unknown")
		}

		const data = await res.json() as Record<string, unknown>

		// N11 hataları HTTP 200 ile döner; result.status kontrolü
		const result = data["result"] as { status?: string; errorCode?: string; errorMessage?: string } | undefined
		if (result && result.status === "failure") {
			const code = result.errorCode ?? "UNKNOWN"
			const msg = result.errorMessage ?? "Bilinmeyen hata"
			throw new N11ApiError(
				mapN11Error(code, msg),
				200,
				"unknown",
				code,
			)
		}

		return data as T
	}

	get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
		return this.request<T>("GET", path, params)
	}

	post<T>(path: string, body: Record<string, unknown>): Promise<T> {
		return this.request<T>("POST", path, body)
	}

	// ── Test Connection ────────────────────────────────────────────────────────

	async testConnection(): Promise<{ ok: boolean; message: string }> {
		try {
			await this.post("/ProductService/GetProductList", {
				pagingData: { currentPage: 0, pageSize: 1 },
			})
			return { ok: true, message: "✅ Bağlantı başarılı" }
		} catch (err) {
			const msg = err instanceof N11ApiError ? err.message : "Bağlantı başarısız"
			return { ok: false, message: msg }
		}
	}

	// ── Rate Limiting (5 req/sn) ───────────────────────────────────────────────

	private async throttle(): Promise<void> {
		const now = Date.now()
		this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < 1_000)

		if (this.requestTimestamps.length >= RATE_LIMIT_PER_SEC) {
			const oldest = this.requestTimestamps[0]!
			const wait = 1_000 - (now - oldest) + 50
			await sleep(wait)
		}
		this.requestTimestamps.push(Date.now())
	}
}

// ── Yardımcı fonksiyonlar ──────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms))
}

function truncateSafe(text: string, max = 200): string {
	const stripped = text.replace(
		/"(appKey|appSecret|password|token)":\s*"[^"]*"/g,
		'"$1":"[REDACTED]"',
	)
	return stripped.length > max ? stripped.slice(0, max) + "…" : stripped
}

function mapN11Error(code: string, message: string): string {
	const MAP: Record<string, string> = {
		"AUTH0001": "API bilgilerin hatalı. n11.com → Mağazam → API Bilgileri sayfasını kontrol et.",
		"AUTH0002": "API erişim yetkisi yok.",
		"PRODUCT0001": "Ürün bulunamadı.",
		"PRODUCT0002": "Ürün stok güncellenemedi.",
		"ORDER0001": "Sipariş bulunamadı.",
		"ORDER0002": "Bu sipariş durumu güncellenemiyor.",
	}
	return MAP[code] ?? `N11 hatası (${code}): ${message}`
}
