import { HepsiburadaApiError, type HepsiburadaConfig, type OAuthToken } from "../types/hepsiburada.js"

const BASE_URL = "https://mpop.hepsiburada.com"
const RATE_LIMIT_PER_MINUTE = 100
const MAX_RETRIES = 4

export class HepsiburadaClient {
	private readonly baseUrl: string
	private readonly merchantId: string
	private readonly username: string
	private readonly password: string

	private token: OAuthToken | null = null

	/** Request timestamps for client-side rate guard (rolling 60s window) */
	private requestTimestamps: number[] = []

	constructor(config: HepsiburadaConfig) {
		this.baseUrl = (config.baseUrl ?? BASE_URL).replace(/\/$/, "")
		this.merchantId = config.merchantId
		// Credentials stored in memory only for token exchange — never logged
		this.username = config.username
		this.password = config.password
	}

	// ── OAuth2 Token Management ────────────────────────────────────────────────

	private async getToken(): Promise<string> {
		const now = Date.now()
		if (this.token && this.token.expiresAt > now + 30_000) {
			return this.token.access_token
		}

		// Token yenile — credentials hiçbir log'a yazılmaz
		let res: Response
		try {
			res = await fetch(`${this.baseUrl}/user/api/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username: this.username,
					password: this.password,
				}),
				signal: AbortSignal.timeout(15_000),
			})
		} catch {
			throw new HepsiburadaApiError(
				"Hepsiburada servisi yanıt vermiyor. İnternet bağlantınızı kontrol edin.",
				0,
				"server_error",
			)
		}

		if (res.status === 401 || res.status === 403) {
			throw new HepsiburadaApiError(
				"API bilgilerin hatalı. HMS panelinden kullanıcı adı ve şifreyi kontrol et.",
				res.status,
				"unauthorized",
			)
		}

		if (!res.ok) {
			throw new HepsiburadaApiError(
				`Token alınamadı (HTTP ${res.status})`,
				res.status,
				"unknown",
			)
		}

		const data = (await res.json()) as { access_token: string; expires_in?: number; token_type?: string }
		const expiresIn = data.expires_in ?? 3600
		this.token = {
			access_token: data.access_token,
			token_type: data.token_type ?? "Bearer",
			expires_in: expiresIn,
			expiresAt: now + expiresIn * 1000,
		}
		return this.token.access_token
	}

	// ── Core Request ───────────────────────────────────────────────────────────

	async request<T>(
		method: string,
		path: string,
		body?: unknown,
		attempt = 1,
	): Promise<T> {
		await this.throttle()

		const accessToken = await this.getToken()
		const url = `${this.baseUrl}${path}`

		let res: Response
		try {
			res = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
					"User-Agent": "nexus-mcp-hepsiburada/1.0",
				},
				body: body ? JSON.stringify(body) : undefined,
				signal: AbortSignal.timeout(30_000),
			})
		} catch {
			throw new HepsiburadaApiError(
				"Hepsiburada servisi yanıt vermiyor. Tekrar dene.",
				0,
				"server_error",
			)
		}

		// Token süresi dolmuş — bir kez yenile ve tekrar dene
		if (res.status === 401 && attempt === 1) {
			this.token = null
			return this.request<T>(method, path, body, 2)
		}

		if (res.status === 401 || res.status === 403) {
			throw new HepsiburadaApiError(
				"API bilgilerin hatalı. HMS panelinden kontrol et.",
				res.status,
				"unauthorized",
			)
		}

		if (res.status === 429) {
			if (attempt > MAX_RETRIES) {
				throw new HepsiburadaApiError(
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
			throw new HepsiburadaApiError(
				"Hepsiburada servisi şu an yanıt vermiyor. Tekrar dene.",
				res.status,
				"server_error",
			)
		}

		if (!res.ok) {
			const text = await res.text().catch(() => "")
			throw new HepsiburadaApiError(
				`Hata ${res.status}: ${truncateSafe(text)}`,
				res.status,
				"unknown",
			)
		}

		if (res.status === 204) return {} as T
		return res.json() as Promise<T>
	}

	get<T>(path: string): Promise<T> {
		return this.request<T>("GET", path)
	}

	post<T>(path: string, body: unknown): Promise<T> {
		return this.request<T>("POST", path, body)
	}

	put<T>(path: string, body: unknown): Promise<T> {
		return this.request<T>("PUT", path, body)
	}

	get mid(): string {
		return this.merchantId
	}

	// ── Test Connection ────────────────────────────────────────────────────────

	async testConnection(): Promise<{ ok: boolean; message: string }> {
		try {
			await this.getToken()
			return { ok: true, message: "✅ Bağlantı başarılı" }
		} catch (err) {
			const msg = err instanceof HepsiburadaApiError ? err.message : "Bağlantı başarısız"
			return { ok: false, message: msg }
		}
	}

	// ── Rate Limiting (100 req/min) ────────────────────────────────────────────

	private async throttle(): Promise<void> {
		const now = Date.now()
		this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < 60_000)

		if (this.requestTimestamps.length >= RATE_LIMIT_PER_MINUTE) {
			const oldest = this.requestTimestamps[0]!
			const wait = 60_000 - (now - oldest) + 100
			await sleep(wait)
		}
		this.requestTimestamps.push(Date.now())
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms))
}

function truncateSafe(text: string, max = 200): string {
	const stripped = text.replace(/"(password|token|access_token)":\s*"[^"]*"/g, '"$1":"[REDACTED]"')
	return stripped.length > max ? stripped.slice(0, max) + "…" : stripped
}
