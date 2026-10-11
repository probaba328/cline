/**
 * Nexus lisans doğrulama — MCP server entegrasyonu
 * Her başlatmada kontrol eder; 24 saatlik yerel cache uygular.
 */

const LICENSE_SERVER = process.env.NEXUS_LICENSE_SERVER ?? "https://license.nexus.dev"
const CACHE_TTL_MS = 24 * 60 * 60 * 1000   // 24 saat

interface CacheEntry {
	valid: boolean
	expiresAt: string | null
	cachedAt: number
}

let _cache: CacheEntry | null = null

export interface LicenseCheckResult {
	valid: boolean
	expiresAt?: string | null
}

export async function checkLicense(
	licenseKey: string,
	product: string,
): Promise<LicenseCheckResult> {
	const now = Date.now()

	// Yerel cache geçerliyse ağa gitme
	if (_cache && now - _cache.cachedAt < CACHE_TTL_MS) {
		return { valid: _cache.valid, expiresAt: _cache.expiresAt }
	}

	let res: Response
	try {
		res = await fetch(`${LICENSE_SERVER}/v1/validate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ license_key: licenseKey, product }),
			signal: AbortSignal.timeout(10_000),
		})
	} catch {
		// Lisans sunucusuna ulaşılamazsa cache'teki son sonucu kullan
		if (_cache) {
			return { valid: _cache.valid, expiresAt: _cache.expiresAt }
		}
		// Cache yoksa çevrimdışı başlatmaya izin ver (grace period)
		return { valid: true, expiresAt: null }
	}

	const data = await res.json() as { valid: boolean; expires_at?: string | null; error?: string }

	_cache = {
		valid: data.valid,
		expiresAt: data.expires_at ?? null,
		cachedAt: now,
	}

	return { valid: data.valid, expiresAt: data.expires_at ?? null }
}

export async function assertLicense(product: string): Promise<void> {
	const licenseKey = process.env.NEXUS_LICENSE_KEY

	if (!licenseKey) {
		console.error(
			`\nLisans anahtarı bulunamadı.\n` +
			`nexus.dev/marketplace adresinden '${product}' ürününü satın alın,\n` +
			`ardından NEXUS_LICENSE_KEY ortam değişkenini ayarlayın.\n`,
		)
		process.exit(1)
	}

	const result = await checkLicense(licenseKey, product)

	if (!result.valid) {
		const expiry = result.expiresAt
			? `Son geçerlilik: ${new Date(result.expiresAt).toLocaleDateString("tr-TR")}`
			: ""
		console.error(
			`\nLisansınız geçersiz veya süresi dolmuş. ${expiry}\n` +
			`nexus.dev/marketplace adresinden yenileyin.\n`,
		)
		process.exit(1)
	}

	if (result.expiresAt) {
		const daysLeft = Math.ceil(
			(new Date(result.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
		)
		if (daysLeft <= 7) {
			console.warn(
				`⚠️  Lisansınız ${daysLeft} gün içinde sona eriyor. nexus.dev/dashboard adresinden yenileyin.`,
			)
		}
	}
}
