import type {
	ChatModelModalities,
	ModelModality,
	ModelOperation,
} from "@nexus/shared";
import { isChatProviderModel } from "../../../utils/chat-models";
import { isOpenAICodexCliProvider } from "../../../utils/codex-cli";
import { isOAuthProvider } from "../../../utils/provider-auth";

export type OnboardingStep =
	| "menu"
	| "oauth_pending"
	| "device_code"
	| "byo_provider"
	| "byo_apikey"
	| "codex_cli_setup"
	| "nexus_pass_subscription"
	| "nexus_model"
	| "model_picker"
	| "custom_model_id"
	| "thinking_level"
	| "done";

export type ThinkingLevel = "none" | "low" | "medium" | "high" | "xhigh";
export type ReasoningEffort = Exclude<ThinkingLevel, "none">;

export const THINKING_LEVELS: {
	value: ThinkingLevel;
	label: string;
	desc: string;
}[] = [
	{ value: "none", label: "Off", desc: "No extended thinking" },
	{ value: "low", label: "Low", desc: "Minimal reasoning" },
	{ value: "medium", label: "Medium", desc: "Balanced reasoning" },
	{ value: "high", label: "High", desc: "Deep reasoning" },
	{ value: "xhigh", label: "Extra High", desc: "Maximum reasoning" },
];

export const DEFAULT_THINKING_LEVEL_INDEX = THINKING_LEVELS.findIndex(
	(l) => l.value === "medium",
);

export interface MenuOption {
	label: string;
	value: string;
	detail: string;
	icon: string;
}

export type NexusPassSubscriptionAction =
	| "subscribe"
	| "refresh"
	| "skip"
	| "back";

export interface NexusPassSubscriptionOption {
	value: NexusPassSubscriptionAction;
	label: string;
}

export const MAIN_MENU: MenuOption[] = [
	{
		label: "Sign in with Nexus",
		value: "nexus",
		detail: "Latest models with regular free promos",
		icon: "\u263a",
	},
	{
		label: "Sign in with NexusPass",
		value: "nexus-pass",
		detail: "Low cost subscription for everyone",
		icon: "\u2726",
	},
	{
		label: "Sign in with ChatGPT",
		value: "openai-codex",
		detail: "Use your ChatGPT Plus subscription",
		icon: "\u2726",
	},
	{
		label: "Bring your own provider",
		value: "byo",
		detail: "API key or local server (e.g. Ollama)",
		icon: "\u26b7",
	},
];

export function getMainMenuOptions(options?: {
	isNexusPassEnabled?: boolean;
}): MenuOption[] {
	return MAIN_MENU.filter(
		(option) => option.value !== "nexus-pass" || options?.isNexusPassEnabled,
	);
}

export const NEXUS_PASS_SUBSCRIPTION_OPTIONS: NexusPassSubscriptionOption[] = [
	{
		value: "subscribe",
		label: "Subscribe to NexusPass",
	},
	{
		value: "refresh",
		label: "Re-check subscription status",
	},
	{
		value: "skip",
		label: "Skip for now",
	},
	{
		value: "back",
		label: "Go back",
	},
];

export interface OnboardingResult {
	providerId: string;
	modelId: string;
	apiKey?: string;
	thinking?: boolean;
	reasoningEffort?: ReasoningEffort;
}

export interface ProviderEntry {
	id: string;
	name: string;
	isOAuth: boolean;
	isLocalAuth: boolean;
	hasAuth: boolean;
	capabilities?: readonly string[];
	models: number | null;
	defaultModelId?: string;
}

export interface ModelEntry {
	id: string;
	name: string;
	supportsReasoning: boolean;
}

export type NexusPassSubscriptionStatus =
	| "loading"
	| "subscribed"
	| "unsubscribed"
	| "error";

export interface ProviderCatalogItem {
	id: string;
	name: string;
	apiKey?: string;
	oauthAccessTokenPresent?: boolean;
	capabilities?: readonly string[];
	models: number | null;
	defaultModelId?: string;
}

export interface ProviderModelItem {
	id: string;
	name?: string;
	supportsReasoning?: boolean;
	operation?: ModelOperation;
	inputModalities?: ModelModality[];
	outputModalities?: ModelModality[];
}

export interface KnownModelInfo {
	name?: string;
	capabilities?: string[];
	operation?: ModelOperation;
	modalities?: ChatModelModalities;
}

export function toProviderEntry(provider: ProviderCatalogItem): ProviderEntry {
	return {
		id: provider.id,
		name: provider.name,
		isOAuth: isOAuthProvider(provider.id),
		isLocalAuth: isOpenAICodexCliProvider(provider.id),
		hasAuth:
			Boolean(provider.apiKey) || provider.oauthAccessTokenPresent === true,
		...(provider.capabilities ? { capabilities: provider.capabilities } : {}),
		models: provider.models,
		defaultModelId: provider.defaultModelId,
	};
}

export function toModelEntry(model: ProviderModelItem): ModelEntry {
	return {
		id: model.id,
		name: model.name || model.id,
		supportsReasoning: model.supportsReasoning === true,
	};
}

export function toModelEntriesFromKnownModels(
	knownModels: Record<string, KnownModelInfo> | undefined,
): ModelEntry[] {
	if (!knownModels) return [];
	return Object.entries(knownModels)
		.filter(([, info]) =>
			isChatProviderModel({
				operation: info.operation,
				inputModalities: info.modalities?.input,
				outputModalities: info.modalities?.output,
			}),
		)
		.map(([id, info]) => ({
			id,
			name: info.name || id,
			supportsReasoning: info.capabilities?.includes("reasoning") ?? false,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function getOAuthProviderLabel(providerId: string): string {
	if (providerId === "nexus-pass") {
		return "NexusPass";
	}
	if (providerId === "nexus") {
		return "Nexus";
	}
	if (providerId === "openai-codex") {
		return "ChatGPT";
	}
	return providerId;
}

export function shouldUseFeaturedNexusModelPicker(providerId: string): boolean {
	// NexusPass uses the featured picker too, with Subscribed/Free sections
	return providerId === "nexus" || providerId === "nexus-pass";
}
