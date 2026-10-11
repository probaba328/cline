import { describe, expect, it } from "vitest";
import {
	buildFeaturedModelEntries,
	NEXUS_PASS_FREE_SECTION_DESCRIPTION,
	freeTierDescriptionFor,
} from "./nexus-model-entries";

const model = (id: string) => ({ id, name: id, description: "", tags: [] });

describe("nexus model picker entries", () => {
	it("builds Recommended/Free sections for the nexus provider", () => {
		const entries = buildFeaturedModelEntries("nexus", {
			recommended: [model("anthropic/claude-sonnet-5")],
			free: [model("deepseek/deepseek-v4-flash")],
			nexusPass: [model("nexus-pass/glm-5.1")],
		});

		expect(entries).toEqual([
			{
				kind: "model",
				model: model("anthropic/claude-sonnet-5"),
				tier: "recommended",
			},
			{
				kind: "model",
				model: model("deepseek/deepseek-v4-flash"),
				tier: "free",
			},
			{ kind: "browse" },
		]);
	});

	it("builds Subscribed/Free sections for the nexus-pass provider", () => {
		const entries = buildFeaturedModelEntries("nexus-pass", {
			recommended: [model("anthropic/claude-sonnet-5")],
			free: [model("deepseek/deepseek-v4-flash")],
			nexusPass: [model("nexus-pass/glm-5.1"), model("nexus-pass/kimi-k2.6")],
		});

		expect(entries).toEqual([
			{ kind: "model", model: model("nexus-pass/glm-5.1"), tier: "subscribed" },
			{
				kind: "model",
				model: model("nexus-pass/kimi-k2.6"),
				tier: "subscribed",
			},
			{
				kind: "model",
				model: model("deepseek/deepseek-v4-flash"),
				tier: "free",
			},
		]);
	});

	it("adds the browse-all escape when the nexusPass bucket is empty", () => {
		// The fetch fell back to the bundled list (no pass models); the sections
		// alone would leave a subscriber able to pick only free models.
		const entries = buildFeaturedModelEntries("nexus-pass", {
			recommended: [],
			free: [model("deepseek/deepseek-v4-flash")],
			nexusPass: [],
		});

		expect(entries).toEqual([
			{
				kind: "model",
				model: model("deepseek/deepseek-v4-flash"),
				tier: "free",
			},
			{ kind: "browse" },
		]);
	});

	it("attaches the quota explainer only to the NexusPass picker's free section", () => {
		const data = {
			recommended: [model("anthropic/claude-sonnet-5")],
			free: [model("deepseek/deepseek-v4-flash")],
			nexusPass: [model("nexus-pass/glm-5.1")],
		};

		expect(
			freeTierDescriptionFor(buildFeaturedModelEntries("nexus-pass", data)),
		).toBe(NEXUS_PASS_FREE_SECTION_DESCRIPTION);
		expect(
			freeTierDescriptionFor(buildFeaturedModelEntries("nexus", data)),
		).toBe(undefined);
	});
});
