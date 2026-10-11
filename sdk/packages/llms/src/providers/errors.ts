import { getNexusEnvironmentConfig } from "@nexus/shared";

export const NEXUS_NOT_SUBSCRIBED_RESPONSE_MESSAGE =
	"the user is not subscribed to required model plan";
const NEXUS_NOT_SUBSCRIBED_FORMATTED_MESSAGE_PREFIX =
	"no access to nexuspass subscription models yet. subscribe to nexuspass";
export const NEXUS_ORG_INDIVIDUAL_INFERENCE_SUBSCRIPTION_RESPONSE_MESSAGE =
	"organization accounts cannot use individual model inference subscriptions";

const NEXUS_PASS_LIMIT_PREFIX = "you have reached your";
const NEXUS_PASS_LIMIT_MARKER = "nexuspass limit";
const NEXUS_PASS_LIMIT_SUFFIX = "please try again later.";
const NEXUS_FREE_MODEL_LIMIT_MARKER = "free limit reached on model";
const NEXUS_FREE_MODEL_LIMIT_RETRY_MARKER = "try again in ";
const NEXUS_MODEL_NOT_FOUND_MARKER = "model not found";

function findNexusPassLimitMessageBounds(
	text: string,
): { start: number; end: number } | undefined {
	const normalized = text.toLowerCase();
	const start = normalized.indexOf(NEXUS_PASS_LIMIT_PREFIX);
	if (start === -1) {
		return undefined;
	}

	const suffixStart = normalized.indexOf(NEXUS_PASS_LIMIT_SUFFIX, start);
	if (suffixStart === -1) {
		return undefined;
	}

	const end = suffixStart + NEXUS_PASS_LIMIT_SUFFIX.length;
	if (!normalized.slice(start, end).includes(NEXUS_PASS_LIMIT_MARKER)) {
		return undefined;
	}

	return { start, end };
}

export function getNexusPassSubscriptionUrl(): string {
	return `${new URL(
		"/dashboard/subscription?personal=true",
		getNexusEnvironmentConfig().appBaseUrl,
	).toString()}`;
}

export function getNexusNotSubscribedMessage(): string {
	return `No access to NexusPass subscription models yet. Subscribe to NexusPass, the low cost open weights model coding plan: ${getNexusPassSubscriptionUrl()}`;
}

export class NexusNotSubscribedError extends Error {
	public readonly providerId?: string;

	constructor(providerId?: string) {
		super(getNexusNotSubscribedMessage());
		this.name = "NexusNotSubscribedError";
		this.providerId = providerId;
	}
}

export function getNexusOrgIndividualInferenceSubscriptionMessage(): string {
	return "Organization accounts cannot use NexusPass subscriptions. Go to /account -> change account to switch to your personal account for NexusPass";
}

export class NexusOrgIndividualInferenceSubscriptionError extends Error {
	public readonly providerId?: string;

	constructor(providerId?: string) {
		super(getNexusOrgIndividualInferenceSubscriptionMessage());
		this.name = "NexusOrgIndividualInferenceSubscriptionError";
		this.providerId = providerId;
	}
}

export class NexusPassLimitError extends Error {
	public readonly providerId?: string;

	constructor(message: string, providerId?: string) {
		super(message);
		this.name = "NexusPassLimitError";
		this.providerId = providerId;
	}
}

export class NexusFreeModelLimitError extends Error {
	public readonly providerId?: string;

	constructor(message: string, providerId?: string) {
		super(message);
		this.name = "NexusFreeModelLimitError";
		this.providerId = providerId;
	}
}

export function isNexusNotSubscribedError(
	error: unknown,
): error is NexusNotSubscribedError {
	return error instanceof NexusNotSubscribedError;
}

export function isNexusOrgIndividualInferenceSubscriptionError(
	error: unknown,
): error is NexusOrgIndividualInferenceSubscriptionError {
	return error instanceof NexusOrgIndividualInferenceSubscriptionError;
}

export function isNexusPassLimitError(
	error: unknown,
): error is NexusPassLimitError {
	return error instanceof NexusPassLimitError;
}

export function isNexusFreeModelLimitError(
	error: unknown,
): error is NexusFreeModelLimitError {
	return error instanceof NexusFreeModelLimitError;
}

export function isNexusNotSubscribedMessage(text: string): boolean {
	const normalized = text.trim().toLowerCase();
	return (
		normalized.includes(NEXUS_NOT_SUBSCRIBED_RESPONSE_MESSAGE) ||
		normalized.includes(NEXUS_NOT_SUBSCRIBED_FORMATTED_MESSAGE_PREFIX)
	);
}

export function isNexusOrgIndividualInferenceSubscriptionMessage(
	text: string,
): boolean {
	return text
		.toLowerCase()
		.includes(NEXUS_ORG_INDIVIDUAL_INFERENCE_SUBSCRIPTION_RESPONSE_MESSAGE);
}

export function isNexusPassLimitMessage(text: string): boolean {
	return findNexusPassLimitMessageBounds(text) !== undefined;
}

export function extractNexusPassLimitMessage(text: string): string | undefined {
	const bounds = findNexusPassLimitMessageBounds(text);
	return bounds ? text.slice(bounds.start, bounds.end) : undefined;
}

export function isNexusFreeModelLimitMessage(text: string): boolean {
	return text.toLowerCase().includes(NEXUS_FREE_MODEL_LIMIT_MARKER);
}

export function isNexusModelNotFoundMessage(text: string): boolean {
	return text.toLowerCase().includes(NEXUS_MODEL_NOT_FOUND_MARKER);
}

export function extractNexusFreeModelLimitResetTime(
	text: string,
): string | undefined {
	const message = text.toLowerCase();
	const resetStart = message.indexOf(NEXUS_FREE_MODEL_LIMIT_RETRY_MARKER);
	if (resetStart === -1) {
		return undefined;
	}

	const resetTime = message
		.slice(resetStart + NEXUS_FREE_MODEL_LIMIT_RETRY_MARKER.length)
		.trim();
	return resetTime || undefined;
}
