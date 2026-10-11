// ── Veritabanı ─────────────────────────────────────────────────────────────────

export type LicenseStatus = "active" | "expired" | "cancelled" | "paused"

export interface LicenseRecord {
	id: number
	licenseKeyHash: string   // SHA-256 hash'i saklanır, ham key asla
	lsLicenseId: number | null
	productName: string
	variantId: number | null
	userEmail: string | null
	status: LicenseStatus
	expiresAt: number | null  // Unix saniye
	lastCheckedAt: number | null
	createdAt: number
}

// ── API İstekleri / Yanıtları ─────────────────────────────────────────────────

export interface ValidateRequest {
	license_key: string
	product: string
}

export interface ValidateResponse {
	valid: boolean
	product?: string
	expires_at?: string | null
	error?: string
}

// ── Lemon Squeezy API ─────────────────────────────────────────────────────────

export interface LSValidateResponse {
	valid: boolean
	error?: string
	license_key?: {
		id: number
		status: string       // "active" | "inactive" | "expired" | "disabled"
		key: string
		activation_limit: number
		activation_usage: number
		created_at: string
		expires_at: string | null
	}
	meta?: {
		store_id: number
		order_id: number
		order_item_id: number
		variant_id: number
		variant_name: string
		product_id: number
		product_name: string
		customer_id: number
		customer_name: string
		customer_email: string
	}
}

export interface LSActivateResponse {
	activated: boolean
	error?: string
	license_key?: {
		id: number
		status: string
		key: string
		expires_at: string | null
	}
	instance?: {
		id: string
		name: string
		created_at: string
	}
	meta?: {
		product_name: string
		customer_email: string
		variant_id: number
	}
}

// ── Webhook ───────────────────────────────────────────────────────────────────

export type LSWebhookEvent =
	| "license_key_created"
	| "license_key_updated"
	| "subscription_created"
	| "subscription_updated"
	| "subscription_cancelled"
	| "subscription_expired"
	| "subscription_resumed"
	| "subscription_payment_success"
	| "subscription_payment_failed"

export interface LSWebhookPayload {
	meta: {
		event_name: LSWebhookEvent
		webhook_id: string
		custom_data?: Record<string, unknown>
	}
	data: {
		id: string
		type: string
		attributes: Record<string, unknown>
	}
}
