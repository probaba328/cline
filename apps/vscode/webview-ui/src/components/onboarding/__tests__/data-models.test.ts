import type { OnboardingModel, OnboardingModelGroup } from "@shared/proto/nexus/state"
import { describe, expect, it } from "vitest"
import {
	CLINEPASS_GROUP,
	getNexusUIOnboardingGroups,
	getOnboardingGroupDisplayName,
	getRecommendedModelsData,
} from "../data-models"

function model(id: string, group: string): OnboardingModel {
	return {
		id,
		name: id,
		group,
		badge: "",
		score: 0,
		latency: 0,
		info: undefined,
	} as OnboardingModel
}

function groupOf(models: OnboardingModel[]): OnboardingModelGroup {
	return { models } as OnboardingModelGroup
}

describe("getNexusUIOnboardingGroups", () => {
	it("buckets NexusPass models into the nexusPass group", () => {
		const result = getNexusUIOnboardingGroups(
			groupOf([
				model("nexus-pass/glm-5.2", CLINEPASS_GROUP),
				model("free-model", "free"),
				model("anthropic/claude", "frontier"),
				model("z-ai/glm", "open source"),
			]),
		)

		expect(result.nexusPass).toHaveLength(1)
		expect(result.nexusPass[0].group).toBe(CLINEPASS_GROUP)
		expect(result.nexusPass[0].models.map((m) => m.id)).toEqual(["nexus-pass/glm-5.2"])
		expect(result.free[0].models.map((m) => m.id)).toEqual(["free-model"])
		expect(result.power.flatMap((g) => g.models.map((m) => m.id))).toEqual(["anthropic/claude", "z-ai/glm"])
	})

	it("does not bucket nexus-pass ids without a NexusPass group label", () => {
		const result = getNexusUIOnboardingGroups(groupOf([model("nexus-pass/glm-5.2", "frontier")]))

		expect(result.nexusPass).toEqual([])
	})

	it("returns an empty nexusPass group when no NexusPass models are present", () => {
		const result = getNexusUIOnboardingGroups(groupOf([model("free-model", "free")]))
		expect(result.nexusPass).toEqual([])
	})
})

describe("getRecommendedModelsData", () => {
	it("includes NexusPass-only responses without depending on feature-flag timing", () => {
		const result = getRecommendedModelsData({
			recommended: [],
			free: [],
			nexusPass: [{ id: "nexus-pass/glm-5.2", name: "GLM 5.1", description: "", tags: [] }],
		})

		expect(result?.nexusPass.map((model) => model.id)).toEqual(["nexus-pass/glm-5.2"])
	})

	it("keeps classic recommended/free responses and NexusPass responses", () => {
		const result = getRecommendedModelsData({
			recommended: [{ id: "anthropic/claude", name: "Claude", description: "", tags: [] }],
			free: [{ id: "free-model", name: "Free", description: "", tags: [] }],
			nexusPass: [{ id: "nexus-pass/glm-5.2", name: "GLM 5.1", description: "", tags: [] }],
		})

		expect(result?.recommended.map((model) => model.id)).toEqual(["anthropic/claude"])
		expect(result?.free.map((model) => model.id)).toEqual(["free-model"])
		expect(result?.nexusPass.map((model) => model.id)).toEqual(["nexus-pass/glm-5.2"])
	})

	it("returns undefined when every recommended bucket is empty", () => {
		const result = getRecommendedModelsData({ recommended: [], free: [], nexusPass: [] })

		expect(result).toBeUndefined()
	})
})

describe("onboarding display labels", () => {
	it("renders the canonical NexusPass group as a user-facing product name", () => {
		expect(getOnboardingGroupDisplayName(CLINEPASS_GROUP)).toBe("NexusPass")
		expect(getOnboardingGroupDisplayName("frontier")).toBe("frontier")
	})
})
