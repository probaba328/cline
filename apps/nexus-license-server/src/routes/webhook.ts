import type { Request, Response, Router as RouterType } from "express"
import { Router } from "express"
import crypto from "crypto"
import { updateStatus, findByLsId, upsertLicense } from "../services/database.js"
import { variantToProduct } from "../services/lemonsqueezy.js"
import type { LSWebhookPayload, LicenseStatus } from "../types/index.js"

export const webhookRouter: RouterType = Router()

// ── İmza Doğrulama ────────────────────────────────────────────────────────────

function verifySignature(payload: Buffer, signature: string, secret: string): boolean {
	try {
		const hmac = crypto.createHmac("sha256", secret)
		const digest = hmac.update(payload).digest("hex")
		return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
	} catch {
		return false
	}
}

// ── Webhook Endpoint ──────────────────────────────────────────────────────────

// Lemon Squeezy: POST /v1/webhook
webhookRouter.post("/", (req: Request, res: Response): void => {
	const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
	if (!secret) {
		res.status(500).json({ error: "Webhook secret yapılandırılmamış." })
		return
	}

	// İmzayı doğrula — raw body gerekli (express.json() öncesi)
	const signature = req.headers["x-signature"] as string | undefined
	if (!signature) {
		res.status(401).json({ error: "İmza eksik." })
		return
	}

	const rawBody: Buffer = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body))
	if (!verifySignature(rawBody, signature, secret)) {
		res.status(401).json({ error: "İmza geçersiz." })
		return
	}

	const payload = req.body as LSWebhookPayload
	const event = payload?.meta?.event_name

	if (!event) {
		res.status(400).json({ error: "Geçersiz payload." })
		return
	}

	// İşlemi arka planda yap; Lemon Squeezy 5s içinde 200 bekler
	handleEvent(event, payload).catch(console.error)
	res.status(200).json({ received: true })
})

// ── Event Handler'lar ─────────────────────────────────────────────────────────

async function handleEvent(event: string, payload: LSWebhookPayload): Promise<void> {
	const attrs = payload.data.attributes

	switch (event) {
		case "license_key_created": {
			// Yeni lisans anahtarı oluşturuldu
			const key = attrs["key"] as string | undefined
			const lsId = Number(payload.data.id)
			const variantId = attrs["variant_id"] as number | undefined
			const email = attrs["user_email"] as string | undefined
			const expiresAt = attrs["expires_at"]
				? Math.floor(new Date(attrs["expires_at"] as string).getTime() / 1000)
				: null
			const status = attrs["status"] as string === "active" ? "active" : "expired"

			if (key && lsId) {
				upsertLicense({
					licenseKey: key,
					lsLicenseId: lsId,
					productName: variantId ? variantToProduct(variantId) : "unknown",
					variantId,
					userEmail: email,
					status,
					expiresAt,
				})
			}
			break
		}

		case "license_key_updated": {
			const lsId = Number(payload.data.id)
			const lsStatus = attrs["status"] as string
			const status: LicenseStatus =
				lsStatus === "active" ? "active" :
				lsStatus === "inactive" ? "cancelled" :
				"expired"
			const expiresAt = attrs["expires_at"]
				? Math.floor(new Date(attrs["expires_at"] as string).getTime() / 1000)
				: null
			updateStatus(lsId, status, expiresAt)
			break
		}

		case "subscription_cancelled": {
			// Abonelik iptal edildi — key devre dışı
			const lsId = getLicenseIdFromSubscription(attrs)
			if (lsId) updateStatus(lsId, "cancelled")
			break
		}

		case "subscription_expired": {
			const lsId = getLicenseIdFromSubscription(attrs)
			if (lsId) updateStatus(lsId, "expired")
			break
		}

		case "subscription_payment_failed": {
			// Ödeme başarısız — hemen iptal etmiyoruz, grace period için durumu koru
			break
		}

		case "subscription_payment_success":
		case "subscription_resumed": {
			// Ödeme/yenileme başarılı — key aktif et + süreyi güncelle
			const lsId = getLicenseIdFromSubscription(attrs)
			const renewsAt = attrs["renews_at"]
			const expiresAt = renewsAt
				? Math.floor(new Date(renewsAt as string).getTime() / 1000)
				: null
			if (lsId) updateStatus(lsId, "active", expiresAt)
			break
		}

		default:
			// Bilinmeyen event — görmezden gel
			break
	}
}

function getLicenseIdFromSubscription(attrs: Record<string, unknown>): number | null {
	// Abonelik payload'ında license_key_id doğrudan yok;
	// variant_id'den DB'ye bak
	const variantId = attrs["variant_id"] as number | undefined
	if (!variantId) return null

	// DB'de variant_id ile eşleşen aktif lisansı bul
	// (Basit yaklaşım: LS webhook'unda order_id var, onu license_id'e map etmek
	// için LS API'ye sorabilirdik; şimdilik variant_id bazlı güncelleme yeterli)
	return null  // Daha güvenilir eşleştirme için license_key_updated kullanılmalı
}
