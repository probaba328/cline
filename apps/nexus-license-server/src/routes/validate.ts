import type { Request, Response, Router as RouterType } from "express"
import { Router } from "express"
import {
	findByKey,
	upsertLicense,
	touchCheckedAt,
} from "../services/database.js"
import {
	validateLicenseKey,
	productVariants,
	LemonSqueezyError,
} from "../services/lemonsqueezy.js"
import type { ValidateRequest, ValidateResponse } from "../types/index.js"

export const validateRouter: RouterType = Router()

// POST /v1/validate
validateRouter.post("/", async (req: Request, res: Response): Promise<void> => {
	const { license_key, product } = req.body as Partial<ValidateRequest>

	if (!license_key || typeof license_key !== "string" || !product || typeof product !== "string") {
		res.status(400).json({
			valid: false,
			error: "license_key ve product alanları zorunludur.",
		} satisfies ValidateResponse)
		return
	}

	const key = license_key.trim()
	if (key.length < 8) {
		res.json({ valid: false, error: "Geçersiz lisans anahtarı formatı." } satisfies ValidateResponse)
		return
	}

	// ── 1. DB'de var mı kontrol et ────────────────────────────────────────────
	const existing = findByKey(key)
	const now = Math.floor(Date.now() / 1000)

	// 24 saatlik cache: son LS kontrolünden bu yana 24h geçmediyse DB'den dön
	const CACHE_TTL = 24 * 60 * 60
	if (
		existing &&
		existing.lastCheckedAt &&
		now - existing.lastCheckedAt < CACHE_TTL
	) {
		const isActive =
			existing.status === "active" &&
			(existing.expiresAt === null || existing.expiresAt > now)

		res.json({
			valid: isActive,
			product: existing.productName,
			expires_at: existing.expiresAt
				? new Date(existing.expiresAt * 1000).toISOString()
				: null,
		} satisfies ValidateResponse)
		return
	}

	// ── 2. Lemon Squeezy API'ye sor ───────────────────────────────────────────
	let lsResult
	try {
		lsResult = await validateLicenseKey(key)
	} catch (err) {
		// LS'e ulaşamıyorsak DB'deki son durumu kullan (graceful degradation)
		if (existing) {
			const isActive =
				existing.status === "active" &&
				(existing.expiresAt === null || existing.expiresAt > now)
			touchCheckedAt(key)
			res.json({
				valid: isActive,
				product: existing.productName,
				expires_at: existing.expiresAt
					? new Date(existing.expiresAt * 1000).toISOString()
					: null,
			} satisfies ValidateResponse)
			return
		}
		const msg = err instanceof LemonSqueezyError ? err.message : "Doğrulama servisi yanıt vermiyor."
		res.status(503).json({ valid: false, error: msg } satisfies ValidateResponse)
		return
	}

	if (!lsResult.valid || !lsResult.license_key || !lsResult.meta) {
		res.json({ valid: false, error: "Lisans anahtarı geçersiz veya etkin değil." } satisfies ValidateResponse)
		return
	}

	const lsMeta = lsResult.meta
	const lsKey = lsResult.license_key

	// ── 3. Ürün kontrolü: bu key bu ürün için mi? ─────────────────────────────
	const allowedVariants = productVariants(product)
	// allowedVariants boşsa (env ayarlı değil) kontrolü atla
	if (allowedVariants.length > 0 && !allowedVariants.includes(lsMeta.variant_id)) {
		res.json({
			valid: false,
			error: `Bu lisans anahtarı '${product}' ürünü için geçerli değil.`,
		} satisfies ValidateResponse)
		return
	}

	// ── 4. Durum kontrolü ─────────────────────────────────────────────────────
	const isActive = lsKey.status === "active"
	const expiresAt = lsKey.expires_at ? Math.floor(new Date(lsKey.expires_at).getTime() / 1000) : null
	const notExpired = expiresAt === null || expiresAt > now

	// ── 5. DB'ye kaydet / güncelle ────────────────────────────────────────────
	upsertLicense({
		licenseKey: key,
		lsLicenseId: lsKey.id,
		productName: product,
		variantId: lsMeta.variant_id,
		userEmail: lsMeta.customer_email,
		status: isActive && notExpired ? "active" : "expired",
		expiresAt,
	})

	res.json({
		valid: isActive && notExpired,
		product,
		expires_at: lsKey.expires_at,
	} satisfies ValidateResponse)
})
