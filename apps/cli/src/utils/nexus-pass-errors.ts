import {
	type NexusSubscriptionPlan,
	extractNexusFreeModelLimitResetTime,
	extractNexusPassLimitMessage,
	getNexusOrgIndividualInferenceSubscriptionMessage,
	isNexusFreeModelLimitError,
	isNexusFreeModelLimitMessage,
	isNexusModelNotFoundMessage,
	isNexusNotSubscribedError,
	isNexusNotSubscribedMessage,
	isNexusOrgIndividualInferenceSubscriptionError,
	isNexusOrgIndividualInferenceSubscriptionMessage,
	isNexusPassLimitError,
	isNexusPassLimitMessage,
} from "@nexus/core";

import { getNexusEnvironmentConfig } from "@nexus/shared";

export { getNexusOrgIndividualInferenceSubscriptionMessage };

export const CLI_PROMO_CODE = "";

export function getCliSubscriptionUrl(): string {
	if (!CLI_PROMO_CODE) {
		return new URL(
			`/dashboard/subscription?personal=true`,
			getNexusEnvironmentConfig().appBaseUrl,
		).toString();
	}

	return `${new URL(
		`/promo?code=${CLI_PROMO_CODE}&personal=true`,
		getNexusEnvironmentConfig().appBaseUrl,
	).toString()}`;
}

export function getCliNotSubscribedMessage(): string {
	return `No access to NexusPass subscription models yet. Subscribe to NexusPass, the low cost open weights model coding plan: ${getCliSubscriptionUrl()}`;
}

export function getCliNexusPassLimitMessage(message: string): string {
	const detail = getNexusPassLimitDetailMessage(message) ?? message.trim();
	const lines = [
		"NexusPass limit reached",
		detail,
		"Switch to Nexus usage-based billing and retry with the Nexus provider.",
		"Interactive CLI: open the model selector with /model, choose Nexus, then retry.",
		"Headless CLI: rerun with --provider nexus.",
	];
	return lines.filter((line) => line.trim().length > 0).join("\n");
}

const NEXUS_FREE_MODEL_PREFIX = "nexus-free/";
const NEXUS_FREE_PROMOTION_ENDED_HEADER = "Free model promotion ended";
const NEXUS_FREE_MODEL_LIMIT_HEADER = "Daily free model limit reached";

export function getCliNexusFreePromotionEndedMessage(): string {
	return [
		NEXUS_FREE_PROMOTION_ENDED_HEADER,
		"The free promotion for this model has ended and it is no longer available.",
		"Select another model to continue.",
		"Open the model selector with /model.",
	].join("\n");
}

export function getCliNexusFreeModelLimitMessage(message: string): string {
	const resetTime = extractNexusFreeModelLimitResetTime(message);
	return [
		NEXUS_FREE_MODEL_LIMIT_HEADER,
		"You've reached today's free usage limit for this model.",
		resetTime
			? `Try again in ${resetTime} or select another model.`
			: "Try again later or select another model.",
		"Open the model selector with /model.",
	].join("\n");
}

export function getIndividualPlanFeatures(
	plans: NexusSubscriptionPlan[],
): string[] {
	const planWithFeatures = plans.find((plan) => plan.interval === "Monthly");

	return planWithFeatures?.features?.included ?? [];
}

function isFormattedNexusPassSubscriptionMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized.includes("no access to nexuspass subscription models yet") &&
		normalized.includes("subscribe to nexuspass")
	);
}

export function isNexusPassSubscriptionError(error: unknown): boolean {
	if (isNexusNotSubscribedError(error)) {
		return true;
	}
	if (error instanceof Error) {
		return (
			error.name === "NexusNotSubscribedError" ||
			isNexusNotSubscribedMessage(error.message) ||
			isFormattedNexusPassSubscriptionMessage(error.message)
		);
	}
	return (
		typeof error === "string" &&
		(isNexusNotSubscribedMessage(error) ||
			isFormattedNexusPassSubscriptionMessage(error))
	);
}

export function isNexusOrgIndividualInferenceSubscriptionErrorMessage(
	error: unknown,
): boolean {
	if (isNexusOrgIndividualInferenceSubscriptionError(error)) {
		return true;
	}
	if (error instanceof Error) {
		return (
			error.name === "NexusOrgIndividualInferenceSubscriptionError" ||
			isNexusOrgIndividualInferenceSubscriptionMessage(error.message) ||
			error.message === getNexusOrgIndividualInferenceSubscriptionMessage()
		);
	}
	return (
		typeof error === "string" &&
		(isNexusOrgIndividualInferenceSubscriptionMessage(error) ||
			error === getNexusOrgIndividualInferenceSubscriptionMessage())
	);
}

export function getNexusPassLimitDetailMessage(
	error: unknown,
): string | undefined {
	return extractNexusPassLimitMessage(
		error instanceof Error ? error.message : String(error),
	);
}

export function isNexusPassLimitErrorMessage(error: unknown): boolean {
	if (isNexusPassLimitError(error)) {
		return true;
	}
	if (error instanceof Error) {
		return (
			error.name === "NexusPassLimitError" ||
			isNexusPassLimitMessage(error.message)
		);
	}
	return typeof error === "string" && isNexusPassLimitMessage(error);
}

// Detects that a deleted free model was requested: the backend answers "model
// not found" once a free promotion ends and the nexus-free/ model is removed.
// The modelId gate keeps regular model-not-found errors on their generic path.
export function isNexusFreePromotionEndedErrorMessage(
	error: unknown,
	modelId?: string,
): boolean {
	const message =
		error instanceof Error
			? error.message
			: typeof error === "string"
				? error
				: "";
	if (
		message
			.toLowerCase()
			.includes(NEXUS_FREE_PROMOTION_ENDED_HEADER.toLowerCase())
	) {
		return true;
	}
	if (!modelId?.startsWith(NEXUS_FREE_MODEL_PREFIX)) {
		return false;
	}
	return isNexusModelNotFoundMessage(message);
}

export function isNexusFreeModelLimitErrorMessage(error: unknown): boolean {
	if (isNexusFreeModelLimitError(error)) {
		return true;
	}
	if (error instanceof Error) {
		return (
			error.name === "NexusFreeModelLimitError" ||
			isNexusFreeModelLimitMessage(error.message)
		);
	}
	return (
		typeof error === "string" &&
		(error
			.toLowerCase()
			.includes(NEXUS_FREE_MODEL_LIMIT_HEADER.toLowerCase()) ||
			isNexusFreeModelLimitMessage(error))
	);
}

export function formatCliErrorMessage(
	error: unknown,
	options?: { modelId?: string },
): string {
	if (isNexusPassSubscriptionError(error)) {
		return getCliNotSubscribedMessage();
	}
	if (isNexusOrgIndividualInferenceSubscriptionErrorMessage(error)) {
		return getNexusOrgIndividualInferenceSubscriptionMessage();
	}
	if (isNexusPassLimitErrorMessage(error)) {
		return getCliNexusPassLimitMessage(
			error instanceof Error ? error.message : String(error),
		);
	}
	if (isNexusFreeModelLimitErrorMessage(error)) {
		return getCliNexusFreeModelLimitMessage(
			error instanceof Error ? error.message : String(error),
		);
	}
	if (isNexusFreePromotionEndedErrorMessage(error, options?.modelId)) {
		return getCliNexusFreePromotionEndedMessage();
	}
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
