import { describe, it, expect } from "bun:test"
import { getProviderDefaultModelId, getProviderModelIdKey } from "@/shared/storage/provider-keys"
import { toLegacyApiProvider } from "../provider-helpers"

describe("Model selection — default model IDs", () => {
	describe("getProviderDefaultModelId", () => {
		it("returns empty string for local-only providers (no remote default)", () => {
			expect(getProviderDefaultModelId("ollama")).toBe("")
			expect(getProviderDefaultModelId("lmstudio")).toBe("")
		})

		it("returns a non-empty string for cloud providers", () => {
			const openrouterDefault = getProviderDefaultModelId("openrouter")
			expect(typeof openrouterDefault).toBe("string")
			expect(openrouterDefault!.length).toBeGreaterThan(0)
		})

		it("openrouter, nexus, and together share the same default (openrouter routing)", () => {
			const openrouterDefault = getProviderDefaultModelId("openrouter")
			expect(getProviderDefaultModelId("nexus")).toBe(openrouterDefault)
			expect(getProviderDefaultModelId("together")).toBe(openrouterDefault)
		})

		it("nexus-pass has its own dedicated default model", () => {
			const nexusPassDefault = getProviderDefaultModelId("nexus-pass")
			const openrouterDefault = getProviderDefaultModelId("openrouter")
			expect(nexusPassDefault).not.toBe(openrouterDefault)
			expect(nexusPassDefault!.length).toBeGreaterThan(0)
		})

		it("returns the SDK-declared default for anthropic", () => {
			const anthropicDefault = getProviderDefaultModelId("anthropic")
			expect(typeof anthropicDefault).toBe("string")
			expect(anthropicDefault!.length).toBeGreaterThan(0)
		})
	})

	describe("getProviderModelIdKey — act vs plan mode", () => {
		it("uses generic mode keys for providers without dedicated slots", () => {
			// moonshot is a static-list provider with no dedicated key
			expect(getProviderModelIdKey("moonshot", "act")).toBe("actModeApiModelId")
			expect(getProviderModelIdKey("moonshot", "plan")).toBe("planModeApiModelId")
		})

		it("uses provider-specific act/plan keys for openrouter", () => {
			expect(getProviderModelIdKey("openrouter", "act")).toBe("actModeOpenRouterModelId")
			expect(getProviderModelIdKey("openrouter", "plan")).toBe("planModeOpenRouterModelId")
		})

		it("uses provider-specific act/plan keys for nexus", () => {
			expect(getProviderModelIdKey("nexus", "act")).toBe("actModeNexusModelId")
			expect(getProviderModelIdKey("nexus", "plan")).toBe("planModeNexusModelId")
		})

		it("uses provider-specific act/plan keys for nexus-pass", () => {
			expect(getProviderModelIdKey("nexus-pass", "act")).toBe("actModeNexusPassModelId")
			expect(getProviderModelIdKey("nexus-pass", "plan")).toBe("planModeNexusPassModelId")
		})

		it("uses provider-specific act/plan keys for ollama", () => {
			expect(getProviderModelIdKey("ollama", "act")).toBe("actModeOllamaModelId")
			expect(getProviderModelIdKey("ollama", "plan")).toBe("planModeOllamaModelId")
		})
	})
})

describe("Model selection — provider ID normalization", () => {
	describe("toLegacyApiProvider", () => {
		it("passes through standard provider IDs unchanged", () => {
			expect(toLegacyApiProvider("anthropic")).toBe("anthropic")
			expect(toLegacyApiProvider("openai")).toBe("openai")
			expect(toLegacyApiProvider("ollama")).toBe("ollama")
		})

		it("maps SDK 'openai-compatible' to legacy 'openai'", () => {
			expect(toLegacyApiProvider("openai-compatible")).toBe("openai")
		})

		it("normalises 'nousresearch' (lowercase) to 'nousResearch'", () => {
			expect(toLegacyApiProvider("nousresearch")).toBe("nousResearch")
			expect(toLegacyApiProvider("nousResearch")).toBe("nousResearch")
		})

		it("preserves casing for unknown provider IDs", () => {
			expect(toLegacyApiProvider("myCustomProvider") as string).toBe("myCustomProvider")
		})
	})
})
