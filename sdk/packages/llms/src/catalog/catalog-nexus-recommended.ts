import { getNexusEnvironmentConfig } from "@nexus/shared";
import type { ModelInfo } from "./types";

export interface NexusRecommendedModelEntry {
	id: string;
	name?: string;
	description?: string;
}

export interface NexusRecommendedModelsPayload {
	nexusPass?: NexusRecommendedModelEntry[];
	free?: NexusRecommendedModelEntry[];
}

type ModelCapabilities = Pick<
	ModelInfo,
	| "contextWindow"
	| "maxInputTokens"
	| "maxTokens"
	| "capabilities"
	| "reasoningOptions"
	| "pricing"
>;

const NEXUS_PASS_PROVIDER_ID = "nexus-pass";
const NEXUS_PROVIDER_ID = "nexus";

const NEXUS_PASS_MODEL_DEFAULTS = {
	contextWindow: 128_000,
	maxInputTokens: 128_000,
	maxTokens: 8_192,
	capabilities: ["tools", "reasoning", "temperature"],
	pricing: {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
	},
} as const satisfies ModelCapabilities;

function findORModelCapabilities(
	entry: NexusRecommendedModelEntry,
	openRouterModels: Record<string, ModelInfo>,
): ModelCapabilities {
	if (!openRouterModels) {
		return NEXUS_PASS_MODEL_DEFAULTS;
	}

	const modelSlug = entry.id.split("/").at(-1) ?? entry.id;

	return openRouterModels[modelSlug] || NEXUS_PASS_MODEL_DEFAULTS;
}

// Nexus-Pass models have only the model name (and not the lab),
// so we need to look-up using glm-5.2 instead of nexus-pass/glm-5.2
function buildModelsNameMap(
	openrouterModels: Record<string, ModelInfo>,
): Record<string, ModelInfo> {
	const nameMap: Record<string, ModelInfo> = {};

	for (const model of Object.values(openrouterModels)) {
		const modelSlugWithoutProvider = model.id.split("/").at(-1) ?? model.id;

		nameMap[modelSlugWithoutProvider] = model;
	}

	return nameMap;
}

export function normalizeNexusRecommendedProviderModels(
	payload: NexusRecommendedModelsPayload,
	openRouterModels: Record<string, ModelInfo>,
): Record<string, Record<string, ModelInfo>> {
	const nexusPass = payload.nexusPass ?? [];
	const models: Record<string, ModelInfo> = {};
	const nexusFreeModels: Record<string, ModelInfo> = {};
	const openRouterModelsByName = buildModelsNameMap(openRouterModels);

	nexusPass.forEach((entry) => {
		const capabilities = findORModelCapabilities(entry, openRouterModelsByName);

		models[entry.id] = {
			// We should use the OR name, unless there is not one (like when using defaults)
			name: entry.name,
			...capabilities,
			id: entry.id,
			description: entry.description,
		};
	});

	// Nexus free models are selectable on the NexusPass provider too (same API
	// underneath; they ride usage billing at $0 instead of the subscription quota).
	// Unlike pass models their ids are full OpenRouter-style ids or nexus-free ids,
	// so look up capabilities by full id before falling back to the slug map.
	(payload.free ?? []).forEach((entry) => {
		const capabilities =
			openRouterModels?.[entry.id] ??
			findORModelCapabilities(entry, openRouterModelsByName);
		// The recommended-models endpoint only sends slug-like names (e.g.
		// "deepseek-v4-flash"), so prefer the OpenRouter catalog's display name
		// for every free entry. Without this, the free overlay overwrites the
		// nice OpenRouter names in the merged nexus/nexus-pass catalogs and the
		// pickers end up rendering raw model ids for the Free section.
		const entryName =
			capabilities.name?.trim() || entry.name?.trim() || entry.id;
		const name = entry.id.startsWith("nexus-free/")
			? `${entryName} (free)`
			: entryName;

		const modelInfo = {
			...capabilities,
			name,
			id: entry.id,
			description: entry.description,
		};

		nexusFreeModels[entry.id] = {
			...modelInfo,
			pricing: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		};

		if (models[entry.id]) {
			return;
		}

		models[entry.id] = {
			...modelInfo,
			pricing: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		};
	});

	const result: Record<string, Record<string, ModelInfo>> = {};
	if (Object.keys(nexusFreeModels).length > 0) {
		result[NEXUS_PROVIDER_ID] = nexusFreeModels;
	}
	if (nexusPass.length > 0) {
		result[NEXUS_PASS_PROVIDER_ID] = models;
	}
	return result;
}

export async function fetchNexusRecommendedModelsPayload(
	fetcher: typeof fetch = fetch,
): Promise<NexusRecommendedModelsPayload> {
	const url = `${getNexusEnvironmentConfig().apiBaseUrl}/api/v1/ai/nexus/recommended-models`;
	const response = await fetcher(url);
	if (!response.ok) {
		throw new Error(
			`Failed to load Nexus recommended models from ${url}: HTTP ${response.status}`,
		);
	}

	return (await response.json()) as NexusRecommendedModelsPayload;
}

export async function fetchNexusRecommendedProviderModels(
	fetcher: typeof fetch = fetch,
	openRouterModels: Record<string, ModelInfo>,
): Promise<Record<string, Record<string, ModelInfo>>> {
	const payload = await fetchNexusRecommendedModelsPayload(fetcher);
	return normalizeNexusRecommendedProviderModels(payload, openRouterModels);
}
