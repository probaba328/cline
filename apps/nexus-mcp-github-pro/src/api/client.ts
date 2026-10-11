import { GitHubApiError } from "../types/github.js"

const BASE_URL = "https://api.github.com"

// GitHub'ın sağladığı rate limit başlıklarını takip ederiz;
// 5000 req/saat istemci tarafı sınırımız.
const RATE_LIMIT_PER_HOUR = 5000
const MAX_RETRIES = 4

export class GitHubClient {
	private readonly token: string
	readonly defaultOwner: string | undefined

	/** Kayan pencere (rolling 1-hour) istek zaman damgaları */
	private requestTimestamps: number[] = []

	constructor(token: string, defaultOwner?: string) {
		this.token = token
		this.defaultOwner = defaultOwner
	}

	// ── Core Request ───────────────────────────────────────────────────────────

	async request<T>(
		method: string,
		path: string,
		body?: unknown,
		attempt = 1,
	): Promise<T> {
		await this.throttle()

		const url = path.startsWith("https://") ? path : `${BASE_URL}${path}`

		let res: Response
		try {
			res = await fetch(url, {
				method,
				headers: {
					// Token hiçbir log'a yazılmaz
					Authorization: `Bearer ${this.token}`,
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
					"Content-Type": "application/json",
					"User-Agent": "nexus-mcp-github-pro/1.0",
				},
				body: body ? JSON.stringify(body) : undefined,
				signal: AbortSignal.timeout(30_000),
			})
		} catch {
			throw new GitHubApiError(
				"GitHub API'sine ulaşılamıyor. İnternet bağlantınızı kontrol edin.",
				0,
				"server_error",
			)
		}

		// Gerçek rate limit bilgisini header'dan güncelle
		const remaining = res.headers.get("x-ratelimit-remaining")
		const resetAt = res.headers.get("x-ratelimit-reset")
		if (remaining !== null && resetAt !== null) {
			this.syncRateLimitHeaders(Number(remaining), Number(resetAt))
		}

		if (res.status === 401) {
			throw new GitHubApiError(
				"GitHub token geçersiz veya süresi dolmuş. Ayarlardan yeni token ekle.",
				401,
				"unauthorized",
			)
		}

		if (res.status === 403) {
			const msg = await res.text().catch(() => "")
			if (msg.includes("rate limit")) {
				const retry = res.headers.get("x-ratelimit-reset")
				const wait = retry ? Math.ceil(Number(retry) - Date.now() / 1000) : 60
				throw new GitHubApiError(
					`GitHub rate limit aşıldı. ${wait} saniye sonra tekrar dene.`,
					403,
					"rate_limit",
				)
			}
			throw new GitHubApiError(
				"Bu işlem için yetkin yok. Token scope'larını kontrol et (repo, workflow).",
				403,
				"forbidden",
			)
		}

		if (res.status === 404) {
			throw new GitHubApiError(
				"Kaynak bulunamadı. Repo adını ve yetkilerini kontrol et.",
				404,
				"not_found",
			)
		}

		if (res.status === 422) {
			const data = await res.json().catch(() => ({})) as { message?: string }
			throw new GitHubApiError(
				`Geçersiz istek: ${data.message ?? "bilinmiyor"}`,
				422,
				"unknown",
			)
		}

		if (res.status === 429) {
			if (attempt > MAX_RETRIES) {
				throw new GitHubApiError(`Rate limit. ${MAX_RETRIES} denemeden sonra başarısız.`, 429, "rate_limit")
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
			throw new GitHubApiError("GitHub servisi yanıt vermiyor. Tekrar dene.", res.status, "server_error")
		}

		if (res.status === 204) return {} as T

		if (!res.ok) {
			const data = await res.json().catch(() => ({})) as { message?: string }
			throw new GitHubApiError(`Hata ${res.status}: ${data.message ?? "bilinmiyor"}`, res.status, "unknown")
		}

		return res.json() as Promise<T>
	}

	get<T>(path: string): Promise<T> { return this.request<T>("GET", path) }
	post<T>(path: string, body: unknown): Promise<T> { return this.request<T>("POST", path, body) }
	put<T>(path: string, body: unknown): Promise<T> { return this.request<T>("PUT", path, body) }
	patch<T>(path: string, body: unknown): Promise<T> { return this.request<T>("PATCH", path, body) }

	// ── Paginated GET ──────────────────────────────────────────────────────────

	async getAll<T>(path: string, maxPages = 5): Promise<T[]> {
		const results: T[] = []
		let url: string | null = `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}per_page=100`

		for (let page = 0; page < maxPages && url; page++) {
			await this.throttle()
			const pageRes: Response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${this.token}`,
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
					"User-Agent": "nexus-mcp-github-pro/1.0",
				},
				signal: AbortSignal.timeout(30_000),
			})
			if (!pageRes.ok) break
			const data = await pageRes.json() as T[]
			results.push(...data)

			// Link header'dan sonraki sayfa
			const linkHeader: string = pageRes.headers.get("link") ?? ""
			const nextMatch: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
			url = nextMatch ? nextMatch[1]! : null
		}

		return results
	}

	// ── Token Test ─────────────────────────────────────────────────────────────

	async testConnection(): Promise<{ ok: boolean; login?: string; message: string }> {
		try {
			const user = await this.get<{ login: string }>("/user")
			return { ok: true, login: user.login, message: `✅ Bağlantı başarılı (${user.login})` }
		} catch (err) {
			const msg = err instanceof GitHubApiError ? err.message : "Bağlantı başarısız"
			return { ok: false, message: msg }
		}
	}

	// ── Repo helper ────────────────────────────────────────────────────────────

	/** "owner/repo" veya "repo" → { owner, repo } */
	parseRepo(input: string): { owner: string; repo: string } {
		if (input.includes("/")) {
			const [owner, repo] = input.split("/", 2)
			return { owner: owner!, repo: repo! }
		}
		if (this.defaultOwner) {
			return { owner: this.defaultOwner, repo: input }
		}
		throw new GitHubApiError(
			`Repo için owner belirtilmedi. "owner/repo" formatında gir veya GITHUB_DEFAULT_OWNER ayarla.`,
			0,
			"unknown",
		)
	}

	// ── Rate Limiting (5000 req/hour) ──────────────────────────────────────────

	private async throttle(): Promise<void> {
		const now = Date.now()
		this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < 3_600_000)

		if (this.requestTimestamps.length >= RATE_LIMIT_PER_HOUR) {
			const oldest = this.requestTimestamps[0]!
			const wait = 3_600_000 - (now - oldest) + 100
			await sleep(wait)
		}
		this.requestTimestamps.push(Date.now())
	}

	private syncRateLimitHeaders(remaining: number, resetEpoch: number): void {
		if (remaining < 10) return
		// Header'dan gelen bilgiyle lokal sayacı senkronize et
		const now = Date.now()
		const windowStart = resetEpoch * 1000 - 3_600_000
		this.requestTimestamps = this.requestTimestamps.filter((t) => t > windowStart)
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms))
}
