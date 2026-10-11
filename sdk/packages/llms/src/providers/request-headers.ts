import { decodeJwtPayload } from "@nexus/shared";

export interface ProviderRequestHeaderClientContext {
	name?: string;
	version?: string;
	versionHeaderFallback?: string;
	platform?: string;
	platformVersion?: string;
	isMultiRoot?: boolean;
}

export interface ProviderRequestHeaderLayers {
	stored?: Record<string, string>;
	config?: Record<string, string>;
	session?: Record<string, string>;
}

export interface OpenAICodexRequestHeaderContext {
	accountId?: string;
	accessToken?: string;
	userAgentVersion?: string;
}

export interface ResolveProviderRequestHeadersInput {
	providerId: string;
	sessionId: string;
	source?: string;
	defaultSource: string;
	client?: ProviderRequestHeaderClientContext;
	coreVersion: string;
	openAiCodex?: OpenAICodexRequestHeaderContext;
	headers?: ProviderRequestHeaderLayers;
}

const DEFAULT_NEXUS_REQUEST_HEADERS: Record<string, string> = {
	"HTTP-Referer": "https://nexus.bot",
	"X-Title": "Nexus",
	"X-IS-MULTIROOT": "false",
	"X-CLIENT-TYPE": "nexus-sdk",
};

function isNexusBillingProvider(providerId: string): boolean {
	return providerId === "nexus" || providerId === "nexus-pass";
}

function trimNonEmpty(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function resolveSource(
	source: string | undefined,
	defaultSource: string,
): string {
	return trimNonEmpty(source) ?? defaultSource;
}

function resolveNexusClientVersion(
	client: ProviderRequestHeaderClientContext | undefined,
): string {
	return (
		trimNonEmpty(client?.version) ??
		trimNonEmpty(client?.versionHeaderFallback) ??
		"unknown"
	);
}

function buildNexusRequestHeaders(
	input: ResolveProviderRequestHeadersInput,
): Record<string, string> | undefined {
	if (!isNexusBillingProvider(input.providerId)) {
		return undefined;
	}
	const source = resolveSource(input.source, input.defaultSource);
	const clientType = trimNonEmpty(input.client?.name) ?? `nexus-${source}`;
	const clientVersion = resolveNexusClientVersion(input.client);
	const platform = trimNonEmpty(input.client?.platform) ?? source;
	const platformVersion =
		trimNonEmpty(input.client?.platformVersion) ?? clientVersion;
	return {
		...DEFAULT_NEXUS_REQUEST_HEADERS,
		"User-Agent": `Nexus/${clientVersion}`,
		"X-IS-MULTIROOT": input.client?.isMultiRoot === true ? "true" : "false",
		"X-CLIENT-TYPE": clientType,
		"X-CLIENT-VERSION": clientVersion,
		"X-PLATFORM": platform,
		"X-PLATFORM-VERSION": platformVersion,
		"X-CORE-VERSION": input.coreVersion,
		"X-Task-ID": input.sessionId,
	};
}

function deriveOpenAICodexAccountId(
	accessToken: string | undefined,
): string | undefined {
	const payload = decodeJwtPayload(accessToken) as
		| {
				"https://api.openai.com/auth"?: { chatgpt_account_id?: string };
				organizations?: Array<{ id?: string }>;
				chatgpt_account_id?: string;
		  }
		| undefined;
	const authAccountId =
		payload?.["https://api.openai.com/auth"]?.chatgpt_account_id;
	if (typeof authAccountId === "string" && authAccountId.length > 0) {
		return authAccountId;
	}
	const orgAccountId = payload?.organizations?.[0]?.id;
	if (typeof orgAccountId === "string" && orgAccountId.length > 0) {
		return orgAccountId;
	}
	const rootAccountId = payload?.chatgpt_account_id;
	if (typeof rootAccountId === "string" && rootAccountId.length > 0) {
		return rootAccountId;
	}
	return undefined;
}

function buildOpenAICodexRequestHeaders(
	input: ResolveProviderRequestHeadersInput,
): Record<string, string> | undefined {
	if (input.providerId !== "openai-codex") {
		return undefined;
	}
	const accountId =
		trimNonEmpty(input.openAiCodex?.accountId) ??
		deriveOpenAICodexAccountId(input.openAiCodex?.accessToken);
	return {
		originator: "nexus",
		session_id: input.sessionId,
		"User-Agent": `Nexus/${trimNonEmpty(input.openAiCodex?.userAgentVersion) ?? "1.0.0"}`,
		...(accountId ? { "ChatGPT-Account-Id": accountId } : {}),
	};
}

function resolveRequiredProviderHeaders(
	input: ResolveProviderRequestHeadersInput,
): Record<string, string> | undefined {
	return (
		buildNexusRequestHeaders(input) ?? buildOpenAICodexRequestHeaders(input)
	);
}

function resolveDefaultProviderHeaders(
	headers: ProviderRequestHeaderLayers | undefined,
): Record<string, string> | undefined {
	return headers?.session ?? headers?.config ?? headers?.stored;
}

export function resolveProviderRequestHeaders(
	input: ResolveProviderRequestHeadersInput,
): Record<string, string> | undefined {
	const requiredHeaders = resolveRequiredProviderHeaders(input);
	if (requiredHeaders) {
		return {
			...(input.headers?.stored ?? {}),
			...(input.headers?.config ?? {}),
			...(input.headers?.session ?? {}),
			...requiredHeaders,
		};
	}
	const headers = resolveDefaultProviderHeaders(input.headers);
	return headers ? { ...headers } : undefined;
}
