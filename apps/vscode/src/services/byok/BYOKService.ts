import type { NexusFileStorage } from "../../shared/storage/NexusFileStorage"
import type { BYOKKeyEntry, BYOKProviderId } from "../../shared/byok/types"
import { maskApiKey } from "../../shared/byok/validation"

const KEY_PREFIX = "byok:"
const INDEX_KEY = "byok:__index__"

/**
 * Manages BYOK API key storage and retrieval.
 *
 * Security guarantees:
 * - Raw API keys are NEVER logged.
 * - Keys are stored in secrets.json (0o600 permissions) via NexusFileStorage.
 * - Only masked keys are surfaced to the UI.
 * - Every operation is stateless — no key is kept in memory beyond the call.
 */
export class BYOKService {
	constructor(private readonly secrets: NexusFileStorage<string>) {}

	/**
	 * Saves an API key for a provider.
	 * The full key goes to secrets storage; only metadata is kept in the index.
	 */
	async saveKey(providerId: BYOKProviderId, apiKey: string, customEndpoint?: string): Promise<void> {
		const storageKey = KEY_PREFIX + providerId
		// Store the raw key in secrets (0o600 file) — NEVER log this
		await this.secrets.set(storageKey, apiKey)

		const entry: BYOKKeyEntry = {
			providerId,
			addedAt: Date.now(),
			maskedKey: maskApiKey(apiKey, providerId),
			...(customEndpoint ? { customEndpoint } : {}),
		}

		const index = this.getIndex()
		index[providerId] = entry
		await this.secrets.set(INDEX_KEY, JSON.stringify(index))
	}

	/** Retrieves the raw API key for a provider. NEVER log the return value. */
	getRawKey(providerId: BYOKProviderId): string | undefined {
		const storageKey = KEY_PREFIX + providerId
		return this.secrets.get(storageKey)
	}

	/** Returns metadata entries (masked keys only) for the UI. */
	listKeys(): BYOKKeyEntry[] {
		return Object.values(this.getIndex())
	}

	/** Deletes a stored key and its index entry. */
	async deleteKey(providerId: BYOKProviderId): Promise<void> {
		const storageKey = KEY_PREFIX + providerId
		await this.secrets.set(storageKey, undefined as unknown as string)

		const index = this.getIndex()
		delete index[providerId]
		await this.secrets.set(INDEX_KEY, JSON.stringify(index))
	}

	/** Updates the lastUsedAt timestamp for a provider key. */
	async touchKey(providerId: BYOKProviderId): Promise<void> {
		const index = this.getIndex()
		if (index[providerId]) {
			index[providerId] = { ...index[providerId], lastUsedAt: Date.now() }
			await this.secrets.set(INDEX_KEY, JSON.stringify(index))
		}
	}

	/** Returns true if a key is stored for the given provider. */
	hasKey(providerId: BYOKProviderId): boolean {
		const storageKey = KEY_PREFIX + providerId
		const val = this.secrets.get(storageKey)
		return typeof val === "string" && val.length > 0
	}

	private getIndex(): Record<string, BYOKKeyEntry> {
		const raw = this.secrets.get(INDEX_KEY)
		if (!raw) return {}
		try {
			return JSON.parse(raw) as Record<string, BYOKKeyEntry>
		} catch {
			return {}
		}
	}
}
