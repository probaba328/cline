import { describe, expect, it } from "vitest";
import {
	formatCliErrorMessage,
	getCliNexusFreeModelLimitMessage,
	getCliNexusPassLimitMessage,
	getCliNotSubscribedMessage,
	getNexusOrgIndividualInferenceSubscriptionMessage,
	getNexusPassLimitDetailMessage,
	isNexusFreeModelLimitErrorMessage,
	isNexusFreePromotionEndedErrorMessage,
	isNexusOrgIndividualInferenceSubscriptionErrorMessage,
	isNexusPassLimitErrorMessage,
	isNexusPassSubscriptionError,
} from "./nexus-pass-errors";

describe("nexus-pass-errors", () => {
	it("recognizes both raw and formatted NexusPass subscription messages", () => {
		expect(
			isNexusPassSubscriptionError(
				"the user is not subscribed to required model plan",
			),
		).toBe(true);

		const sdkFormatted =
			"No access to NexusPass subscription models yet. Subscribe to NexusPass, the low cost open weights model coding plan: https://app.nexus.bot/dashboard/subscription?personal=true";
		const formatted = getCliNotSubscribedMessage();
		expect(isNexusPassSubscriptionError(sdkFormatted)).toBe(true);
		expect(isNexusPassSubscriptionError(formatted)).toBe(true);
		expect(formatCliErrorMessage(new Error(sdkFormatted))).toBe(formatted);
		expect(formatCliErrorMessage(new Error(formatted))).toBe(formatted);
	});

	it("recognizes and formats organization account individual subscription errors", () => {
		const raw =
			"403 Error 403: organization accounts cannot use individual model inference subscriptions";
		const formatted = getNexusOrgIndividualInferenceSubscriptionMessage();

		expect(isNexusOrgIndividualInferenceSubscriptionErrorMessage(raw)).toBe(
			true,
		);
		expect(
			isNexusOrgIndividualInferenceSubscriptionErrorMessage(
				new Error(formatted),
			),
		).toBe(true);
		expect(formatCliErrorMessage(new Error(raw))).toBe(formatted);
		expect(formatCliErrorMessage(new Error(raw))).not.toContain(
			"deepseek-v4-flash",
		);
	});

	it("recognizes and formats NexusPass period limit errors with usage-billing guidance", () => {
		const raw =
			"Error: You have reached your 5-hour Nexuspass limit. The limit resets in 5h, please try again later.";
		const detail =
			"You have reached your 5-hour Nexuspass limit. The limit resets in 5h, please try again later.";

		expect(isNexusPassLimitErrorMessage(raw)).toBe(true);
		expect(isNexusPassLimitErrorMessage(new Error(raw))).toBe(true);
		expect(getNexusPassLimitDetailMessage(raw)).toBe(detail);
		expect(formatCliErrorMessage(new Error(raw))).toBe(
			getCliNexusPassLimitMessage(raw),
		);
		expect(formatCliErrorMessage(new Error(raw))).toContain(
			"Switch to Nexus usage-based billing",
		);
		expect(formatCliErrorMessage(new Error(raw))).toContain("--provider nexus");
	});

	it("recognizes and formats daily free model limits without usage-billing guidance", () => {
		const raw =
			"Error: Error 429: Daily free limit reached on model deepseek/deepseek-v4-flash. Try again in 23h 59m";

		expect(isNexusFreeModelLimitErrorMessage(raw)).toBe(true);
		expect(isNexusFreeModelLimitErrorMessage(new Error(raw))).toBe(true);
		expect(formatCliErrorMessage(new Error(raw))).toBe(
			getCliNexusFreeModelLimitMessage(raw),
		);
		expect(formatCliErrorMessage(new Error(raw))).not.toContain("Error 429");
		expect(formatCliErrorMessage(new Error(raw))).toContain(
			"Try again in 23h 59m",
		);
		expect(formatCliErrorMessage(new Error(raw))).toContain(
			"select another model",
		);
		expect(formatCliErrorMessage(new Error(raw))).not.toContain(
			"usage-based billing",
		);
		expect(
			isNexusFreeModelLimitErrorMessage(getCliNexusFreeModelLimitMessage(raw)),
		).toBe(true);
	});

	it("formats model-not-found errors for removed free models", () => {
		const raw = new Error("Error 404: model not found");

		expect(
			formatCliErrorMessage(raw, { modelId: "nexus-free/retired-model" }),
		).toContain("Free model promotion ended");
		expect(
			isNexusFreePromotionEndedErrorMessage(
				formatCliErrorMessage(raw, { modelId: "nexus-free/retired-model" }),
			),
		).toBe(true);
		expect(
			formatCliErrorMessage(raw, { modelId: "vendor/retired-model" }),
		).toBe(raw.message);
	});
});
