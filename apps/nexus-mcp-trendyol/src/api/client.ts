import { TrendyolApiError, type TrendyolConfig } from "../types/trendyol.js"

const BASE_URL = "https://api.trendyol.com/sapigw"
const MAX_RETRIES = 4
const RATE_LIMIT_PER_SECOND = 10

export class TrendyolClient {
	private readonly baseUrl: string
	private readonly authHeader: string
	private readonly supplierId: string

	/** Tracks request timestamps for client-side rate guard */
	private requestTimestamps: number[] = []

	constructor(config: TrendyolConfig) {
		this.supplierId = config.supplierId
		this.baseUrl = (config.baseUrl ?? BASE_URL) + `/suppliers/${config.supplierId}`

		// API bilgileri loglanmaz — sadece base64 header'da kullanılır
		const encoded = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")
		this.authHeader = `Basic ${encoded}`
	}

	// ── Public helpers ─────────────────────────────────────────────────────────

	get supplierPath(): string {
		return `/suppliers/${this.supplierId}`
	}

	// ── Core request method ────────────────────────────────────────────────────

	async request<T>(
		method: string,
		path: string,
		body?: unknown,
		attempt = 1,
	): Promise<T> {
		await this.throttle()

		const url = `${this.baseUrl}${path}`
		const headers: Record<string, string> = {
			Authorization: this.authHeader,
			"Content-Type": "application/json",
			"User-Agent": "nexus-mcp-trendyol/1.0",
		}

		let res: Response
		try {
			res = await fetch(url, {
				method,
				headers,
				body: body ? JSON.stringify(body) : undefined,
				signal: AbortSignal.timeout(30_000),
			})
		} catch (err) {
			throw new TrendyolApiError(
				"Trendyol servisi şu an yanıt vermiyor. Tekrar dene.",
				0,
				"server_error",
			)
		}

		// 429 — rate limit, exponential backoff
		if (res.status === 429) {
			if (attempt > MAX_RETRIES) {
				throw new TrendyolApiError(
					`Rate limit aşıldı. ${MAX_RETRIES} denemeden sonra başarısız.`,
					429,
					"rate_limit",
				)
			}
			const backoff = Math.pow(2, attempt) * 500 + Math.random() * 200
			await sleep(backoff)
			return this.request<T>(method, path, body, attempt + 1)
		}

		if (res.status === 401 || res.status === 403) {
			throw new TrendyolApiError(
				"API bilgilerin hatalı. Trendyol panelinden kontrol et.",
				res.status,
				"unauthorized",
			)
		}

		if (res.status >= 500) {
			if (attempt <= 2) {
				await sleep(Math.pow(2, attempt) * 1000)
				return this.request<T>(method, path, body, attempt + 1)
			}
			throw new TrendyolApiError(
				"Trendyol servisi şu an yanıt vermiyor. Tekrar dene.",
				res.status,
				"server_error",
			)
		}

		if (!res.ok) {
			const text = await res.text().catch(() => "")
			throw new TrendyolApiError(
				`Hata ${res.status}: ${truncateSafe(text)}`,
				res.status,
				"unknown",
			)
		}

		// 204 No Content
		if (res.status === 204) {
			return {} as T
		}

		return res.json() as Promise<T>
	}

	// ── Convenience wrappers ───────────────────────────────────────────────────

	get<T>(path: string): Promise<T> {
		return this.request<T>("GET", path)
	}

	post<T>(path: string, body: unknown): Promise<T> {
		return this.request<T>("POST", path, body)
	}

	put<T>(path: string, body: unknown): Promise<T> {
		return this.request<T>("PUT", path, body)
	}

	// ── Test connection ────────────────────────────────────────────────────────

	async testConnection(): Promise<{ ok: boolean; message: string }> {
		try {
			await this.get("/products?page=0&size=1")
			return { ok: true, message: "✅ Bağlantı başarılı" }
		} catch (err) {
			const msg = err instanceof TrendyolApiError ? err.message : "Bağlantı başarısız"
			return { ok: false, message: msg }
		}
	}

	// ── Rate limiting ──────────────────────────────────────────────────────────

	private async throttle(): Promise<void> {
		const now = Date.now()
		this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < 1000)

		if (this.requestTimestamps.length >= RATE_LIMIT_PER_SECOND) {
			const oldest = this.requestTimestamps[0]!
			const wait = 1000 - (now - oldest) + 10
			await sleep(wait)
		}
		this.requestTimestamps.push(Date.now())
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function truncateSafe(text: string, max = 200): string {
	const stripped = text.replace(/"(apiKey|apiSecret|password|token)":\s*"[^"]*"/g, '"$1":"[REDACTED]"')
	return stripped.length > max ? stripped.slice(0, max) + "…" : stripped
}
