import type { BYOKProviderId, BYOKValidationResult } from "./types"
import { getBYOKProvider } from "./catalog"

/**
 * Validates the format of an API key against provider-specific regex.
 * Never logs or stores the key — only returns ok/fail.
 */
export function validateKeyFormat(providerId: BYOKProviderId, apiKey: string): BYOKValidationResult {
	const provider = getBYOKProvider(providerId)
	if (!provider) {
		return { ok: false, message: "Bilinmeyen sağlayıcı", code: "unknown" }
	}

	if (provider.isLocal && !provider.keyRegex) {
		return { ok: true, message: "Yerel sağlayıcı — API key gerekmez" }
	}

	if (!apiKey || apiKey.trim().length === 0) {
		return { ok: false, message: "API key boş olamaz", code: "invalid_key" }
	}

	if (provider.keyRegex) {
		const re = new RegExp(provider.keyRegex)
		if (!re.test(apiKey.trim())) {
			const prefix = provider.keyPrefix ? `"${provider.keyPrefix}..." ile başlamalı` : "Geçersiz format"
			return { ok: false, message: `Geçersiz key formatı — ${prefix}`, code: "invalid_key" }
		}
	}

	return { ok: true, message: "Format geçerli" }
}

/**
 * Masks an API key for safe display. Never shows more than the prefix + last 4 chars.
 * E.g. "sk-ant-api03-abcdefgh" → "sk-ant-...efgh"
 * Key is NEVER logged, stored in plain text, or shown in full.
 */
export function maskApiKey(apiKey: string, providerId?: BYOKProviderId): string {
	if (!apiKey || apiKey.length < 8) {
		return "****"
	}

	const provider = providerId ? getBYOKProvider(providerId) : undefined
	const prefix = provider?.keyPrefix ?? apiKey.slice(0, Math.min(6, apiKey.length - 4))
	const suffix = apiKey.slice(-4)

	if (apiKey.length <= prefix.length + 4) {
		return `${prefix}...`
	}

	return `${prefix}...${suffix}`
}

/**
 * Maps HTTP status codes + provider error responses to user-friendly messages.
 * Stack traces must NOT be included in returned messages.
 */
export function mapProviderError(
	providerId: BYOKProviderId,
	httpStatus: number | null,
	responseBody?: string,
): BYOKValidationResult {
	if (httpStatus === 401 || httpStatus === 403) {
		return {
			ok: false,
			message: "API key geçersiz veya yetkisiz. Lütfen key'i kontrol edin.",
			code: "invalid_key",
		}
	}

	if (httpStatus === 429) {
		return {
			ok: false,
			message: "Rate limit aşıldı. Birkaç saniye bekleyip tekrar deneyin.",
			code: "rate_limit",
		}
	}

	if (httpStatus === 402) {
		return {
			ok: false,
			message: "Hesabınızda yeterli kredi yok. Sağlayıcı hesabınızı kontrol edin.",
			code: "insufficient_credits",
		}
	}

	if (httpStatus === 404) {
		return {
			ok: false,
			message: "Model veya endpoint bulunamadı.",
			code: "model_not_found",
		}
	}

	if (!httpStatus) {
		return {
			ok: false,
			message: "Ağ hatası — sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.",
			code: "network_error",
		}
	}

	// Check for provider-specific error messages without leaking internals
	if (responseBody && !responseBody.includes('"apiKey"') && !responseBody.includes('"key"')) {
		try {
			const body = JSON.parse(responseBody) as { error?: { message?: string }; message?: string }
			const msg = body?.error?.message ?? body?.message
			if (msg && msg.length < 200) {
				return { ok: false, message: msg, code: "unknown" }
			}
		} catch {
			// ignore parse errors
		}
	}

	return {
		ok: false,
		message: `Doğrulama başarısız (HTTP ${httpStatus ?? "bağlantı hatası"})`,
		code: "unknown",
	}
}
