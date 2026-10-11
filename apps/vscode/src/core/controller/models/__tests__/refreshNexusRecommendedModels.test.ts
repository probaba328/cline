import * as sdkCore from "@nexus/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NexusEnv } from "@/config"
import { refreshNexusRecommendedModels, resetNexusRecommendedModelsCacheForTests } from "../refreshNexusRecommendedModels"

// The HTTP fetch + normalization + offline fallback lives in the SDK
// (`@nexus/core` `fetchNexusRecommendedModels`). These tests cover the
// extension-side wrapper: delegation to the SDK and in-memory caching. There is
// intentionally no feature-flag gate here; onboarding must not race against the
// remote-config cache and accidentally keep the hardcoded fallback list.

describe("refreshNexusRecommendedModels", () => {
	beforeEach(() => {
		resetNexusRecommendedModelsCacheForTests()
		// NexusEnv is not initialized in the unit-test environment; the wrapper
		// passes its apiBaseUrl to the SDK, so provide a stable stub.
		vi.spyOn(NexusEnv, "config").mockReturnValue({ apiBaseUrl: "https://api.nexus-test.bot" } as ReturnType<
			typeof NexusEnv.config
		>)
	})

	afterEach(() => {
		resetNexusRecommendedModelsCacheForTests()
		vi.restoreAllMocks()
	})

	it("delegates to the SDK fetch", async () => {
		const sdkResult = {
			recommended: [{ id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", description: "Remote", tags: ["NEW"] }],
			free: [{ id: "nexus-free/glm-5", name: "GLM 5", description: "Remote free", tags: [] }],
			nexusPass: [],
		}
		const sdkSpy = vi.spyOn(sdkCore, "fetchNexusRecommendedModels").mockResolvedValue(sdkResult)

		const result = await refreshNexusRecommendedModels()

		expect(sdkSpy).toHaveBeenCalledTimes(1)
		expect(result).toEqual(sdkResult)
	})

	it("uses the in-memory cache after a populated upstream result", async () => {
		const sdkResult = {
			recommended: [{ id: "google/gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", description: "Remote", tags: ["NEW"] }],
			free: [],
			nexusPass: [],
		}
		const sdkSpy = vi.spyOn(sdkCore, "fetchNexusRecommendedModels").mockResolvedValue(sdkResult)

		const firstResult = await refreshNexusRecommendedModels()
		const secondResult = await refreshNexusRecommendedModels()

		expect(sdkSpy).toHaveBeenCalledTimes(1)
		expect(secondResult).toEqual(firstResult)
	})

	it("does not cache the SDK fallback result", async () => {
		const sdkFallbackClone = structuredClone(sdkCore.FALLBACK_NEXUS_RECOMMENDED_MODELS)
		const sdkSpy = vi
			.spyOn(sdkCore, "fetchNexusRecommendedModels")
			.mockResolvedValueOnce(sdkFallbackClone)
			.mockResolvedValueOnce({
				recommended: [
					{ id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", description: "Remote", tags: ["NEW"] },
				],
				free: [],
				nexusPass: [],
			})

		const firstResult = await refreshNexusRecommendedModels()
		const secondResult = await refreshNexusRecommendedModels()

		expect(sdkSpy).toHaveBeenCalledTimes(2)
		expect(firstResult).toEqual(sdkCore.FALLBACK_NEXUS_RECOMMENDED_MODELS)
		expect(secondResult).not.toEqual(sdkCore.FALLBACK_NEXUS_RECOMMENDED_MODELS)
	})
})
