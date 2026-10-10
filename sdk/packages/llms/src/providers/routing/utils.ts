import { isNexusProvider } from "@nexus/shared";

export type ProviderOptionsPatch = Record<string, Record<string, unknown>>;

export function toProviderOptionsKey(providerId: string): string {
	return providerId.replace(/-([a-z0-9])/gi, (_match, char: string) =>
		char.toUpperCase(),
	);
}

export function createEphemeralCacheControl() {
	return {
		cache_control: { type: "ephemeral" as const },
	};
}

/**
 * Target the AI SDK provider-name bucket for the provider id and, when
 * distinct, its camelCase alias bucket (e.g. `vercel-ai-gateway` +
 * `vercelAiGateway`).
 *
 * The bucket name must match the AI SDK provider `name`, because the
 * openai-compatible model only applies request-body passthrough from
 * `providerOptions[<name>]` (and its camelCase alias). For almost every
 * provider the name is the gateway provider id, but both Nexus gateway ids
 * (`nexus` and `nexus-pass`) are served by the shared "nexus" AI SDK provider
 * (see `createNexusProviderModule`) and hit the same Nexus API, so their
 * options key to the shared `nexus` bucket.
 */
export function buildProviderAndAliasPatch(options: {
	providerId: string;
	providerOptionsKey: string;
	bucketOptions: Record<string, unknown>;
}): ProviderOptionsPatch {
	const { bucketOptions } = options;
	const providerId = isNexusProvider(options.providerId)
		? "nexus"
		: options.providerId;
	const providerOptionsKey = isNexusProvider(options.providerId)
		? "nexus"
		: options.providerOptionsKey;
	const needsAlias =
		providerOptionsKey !== providerId && providerOptionsKey !== "anthropic";
	return {
		[providerId]: bucketOptions,
		...(needsAlias ? { [providerOptionsKey]: bucketOptions } : {}),
	};
}

export function buildThinkingPatch(options: {
	providerId: string;
	providerOptionsKey: string;
	thinkingType: "enabled" | "disabled";
}): ProviderOptionsPatch {
	const bucketOptions = { thinking: { type: options.thinkingType } };
	return {
		...buildProviderAndAliasPatch({
			providerId: options.providerId,
			providerOptionsKey: options.providerOptionsKey,
			bucketOptions,
		}),
		openaiCompatible: bucketOptions,
	};
}
