import type { LSValidateResponse, LSActivateResponse } from "../types/index.js"

const LS_API_BASE = "https://api.lemonsqueezy.com/v1"

function apiKey(): string {
	const key = process.env.LEMONSQUEEZY_API_KEY
	if (!key) throw new Error("LEMONSQUEEZY_API_KEY eksik")
	return key
}

function headers(): Record<string, string> {
	return {
		// API key hiçbir log'a yazılmaz
		Authorization: `Bearer ${apiKey()}`,
		Accept: "application/vnd.api+json",
		"Content-Type": "application/vnd.api+json",
	}
}

// ── Lisans Doğrulama ──────────────────────────────────────────────────────────

export async function validateLicenseKey(
	licenseKey: string,
	instanceName = "nexus-mcp",
): Promise<LSValidateResponse> {
	let res: Response
	try {
		res = await fetch(`${LS_API_BASE}/licenses/validate`, {
			method: "POST",
			headers: {
				...headers(),
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				license_key: licenseKey,
				instance_name: instanceName,
			}),
			signal: AbortSignal.timeout(15_000),
		})
	} catch {
		throw new LemonSqueezyError("Lemon Squeezy API'sine ulaşılamıyor.")
	}

	if (res.status === 400) {
		return { valid: false, error: "Geçersiz lisans anahtarı." }
	}

	if (!res.ok) {
		throw new LemonSqueezyError(`LS API hatası: HTTP ${res.status}`)
	}

	return res.json() as Promise<LSValidateResponse>
}

// ── Lisans Aktivasyon ─────────────────────────────────────────────────────────

export async function activateLicenseKey(
	licenseKey: string,
	instanceName: string,
): Promise<LSActivateResponse> {
	let res: Response
	try {
		res = await fetch(`${LS_API_BASE}/licenses/activate`, {
			method: "POST",
			headers: {
				...headers(),
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				license_key: licenseKey,
				instance_name: instanceName,
			}),
			signal: AbortSignal.timeout(15_000),
		})
	} catch {
		throw new LemonSqueezyError("Lemon Squeezy API'sine ulaşılamıyor.")
	}

	if (!res.ok) {
		const data = await res.json().catch(() => ({})) as { error?: string }
		throw new LemonSqueezyError(data.error ?? `LS aktivasyon hatası: HTTP ${res.status}`)
	}

	return res.json() as Promise<LSActivateResponse>
}

// ── Lisans Deaktivasyonu ──────────────────────────────────────────────────────

export async function deactivateLicenseKey(licenseKey: string, instanceId: string): Promise<void> {
	await fetch(`${LS_API_BASE}/licenses/deactivate`, {
		method: "POST",
		headers: {
			...headers(),
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			license_key: licenseKey,
			instance_id: instanceId,
		}),
		signal: AbortSignal.timeout(10_000),
	}).catch(() => {
		// Deaktivasyon başarısız olsa da devam et
	})
}

// ── Variant → Ürün adı eşleştirme ────────────────────────────────────────────

const VARIANT_MAP: Record<string, string> = {
	[process.env.LS_VARIANT_TRENDYOL ?? "0"]: "trendyol",
	[process.env.LS_VARIANT_HEPSIBURADA ?? "0"]: "hepsiburada",
	[process.env.LS_VARIANT_GITHUB_PRO ?? "0"]: "github-pro",
	[process.env.LS_VARIANT_ANALYTICS ?? "0"]: "analytics",
	[process.env.LS_VARIANT_BUNDLE ?? "0"]: "bundle",
}

export function variantToProduct(variantId: number): string {
	return VARIANT_MAP[String(variantId)] ?? "unknown"
}

export function productVariants(product: string): number[] {
	if (product === "bundle") {
		// Bundle tüm ürünleri içerir
		return Object.keys(VARIANT_MAP)
			.map(Number)
			.filter((n) => n > 0)
	}
	const entry = Object.entries(VARIANT_MAP).find(([, p]) => p === product)
	const bundleId = Number(process.env.LS_VARIANT_BUNDLE ?? 0)
	const ids: number[] = []
	if (entry) ids.push(Number(entry[0]))
	if (bundleId > 0) ids.push(bundleId)
	return ids
}

export class LemonSqueezyError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "LemonSqueezyError"
	}
}
