import { FALLBACK_NEXUS_RECOMMENDED_MODELS, fetchNexusRecommendedModels } from "@nexus/core"
import { NexusEnv } from "@/config"
import { fetch } from "@/shared/net"

interface NexusRecommendedModelData {
	id: string
	name: string
	description: string
	tags: string[]
}

export interface NexusRecommendedModelsData {
	recommended: NexusRecommendedModelData[]
	free: NexusRecommendedModelData[]
	nexusPass?: NexusRecommendedModelData[]
}

const RECOMMENDED_MODELS_CACHE_TTL_MS = 60 * 60 * 1000

let pendingRefresh: Promise<NexusRecommendedModelsData> | null = null
let inMemoryCache: { data: NexusRecommendedModelsData; timestamp: number } | null = null

export async function refreshNexusRecommendedModels(): Promise<NexusRecommendedModelsData> {
	if (inMemoryCache && Date.now() - inMemoryCache.timestamp <= RECOMMENDED_MODELS_CACHE_TTL_MS) {
		return inMemoryCache.data
	}

	if (pendingRefresh) {
		return pendingRefresh
	}

	pendingRefresh = (async () => {
		try {
			return await fetchAndCacheNexusRecommendedModels()
		} finally {
			pendingRefresh = null
		}
	})()

	return pendingRefresh
}

export function resetNexusRecommendedModelsCacheForTests(): void {
	pendingRefresh = null
	inMemoryCache = null
}

function isFallbackRecommendedModels(data: NexusRecommendedModelsData): boolean {
	return JSON.stringify(data) === JSON.stringify(FALLBACK_NEXUS_RECOMMENDED_MODELS)
}

async function fetchAndCacheNexusRecommendedModels(): Promise<NexusRecommendedModelsData> {
	// Delegate the actual HTTP fetch + response normalization + offline fallback
	// to the SDK so the CLI/JetBrains and the extension share one implementation.
	// We pass the proxy-aware fetch (per .nexusrules/network.md) and the
	// extension's configured API base URL. On failure the SDK returns its own
	// fallback list.
	const result = await fetchNexusRecommendedModels({
		baseUrl: NexusEnv.config().apiBaseUrl,
		fetchImpl: fetch,
	})

	// Only pin a populated, non-fallback result in memory for the full TTL; a
	// transient failure (SDK returns a clone of its fallback) should be retried
	// next call.
	if ((result.recommended.length > 0 || result.free.length > 0) && !isFallbackRecommendedModels(result)) {
		inMemoryCache = { data: result, timestamp: Date.now() }
	}
	return result
}
