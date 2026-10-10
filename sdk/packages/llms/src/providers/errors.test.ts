import { describe, expect, it } from "vitest";
import { isNexusPassLimitMessage } from "../index.browser";
import {
	extractNexusFreeModelLimitResetTime,
	extractNexusPassLimitMessage,
	isNexusFreeModelLimitMessage,
} from "./errors";

describe("isNexusPassLimitMessage", () => {
	it("matches the NexusPass weekly limit message", () => {
		const message =
			"You have reached your weekly Nexuspass limit. The limit resets in 7d, please try again later.";
		expect(isNexusPassLimitMessage(message)).toBe(true);
	});

	it("matches the 5-hour NexusPass limit message", () => {
		const message =
			"You have reached your 5-hour Nexuspass limit. The limit resets in 5h, please try again later.";
		expect(isNexusPassLimitMessage(message)).toBe(true);
	});

	it("handles tab-heavy non-matches without regex backtracking", () => {
		expect(
			isNexusPassLimitMessage(`You have reached your\t${"\t".repeat(10_000)}`),
		).toBe(false);
		expect(
			isNexusPassLimitMessage(`You have reached your\t-${"\t".repeat(10_000)}`),
		).toBe(false);
		expect(
			isNexusPassLimitMessage(
				`You have reached your\t-\tNexuspass limit.The limit resets in\t${"\t".repeat(10_000)}`,
			),
		).toBe(false);
	});
});

describe("extractNexusPassLimitMessage", () => {
	it("extracts the NexusPass weekly limit message", () => {
		const message =
			"You have reached your weekly Nexuspass limit. The limit resets in 7d, please try again later.";

		const extracted = extractNexusPassLimitMessage(`Error: ${message}`);
		expect(extracted).toBe(message);
	});

	it("extracts the 5-hour NexusPass limit message", () => {
		const message =
			"You have reached your 5-hour Nexuspass limit. The limit resets in 5h, please try again later.";

		const extracted = extractNexusPassLimitMessage(`Error: ${message}`);
		expect(extracted).toBe(message);
	});
});

describe("Nexus free model limit messages", () => {
	const message =
		"Daily free limit reached on model deepseek/deepseek-v4-flash. Try again in 23h 59m";

	it("detects the message in an HTTP error", () => {
		const error = `Error: Error 429: ${message}`;
		expect(isNexusFreeModelLimitMessage(error)).toBe(true);
		expect(extractNexusFreeModelLimitResetTime(error)).toBe("23h 59m");
	});

	it("does not match unrelated daily limits", () => {
		expect(
			isNexusFreeModelLimitMessage(
				"Your daily spend limit has been reached. Try again in 23h 59m",
			),
		).toBe(false);
	});
});
