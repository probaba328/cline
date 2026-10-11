import { describe, expect, it } from "vitest"
import { NexusError, NexusErrorType } from "../services/error/NexusError"
import { reshapeErrorForWebview } from "./message-translator"

// Once a free promotion ends the nexus-free/ model is removed from the catalog
// and the backend answers "model not found". These tests pin the host-side
// detection that turns that answer into the webview's promotion-ended card.
describe("reshapeErrorForWebview - free promotion ended", () => {
	it("stamps the promotion-ended code when a nexus-free model answers model-not-found", () => {
		const payload = reshapeErrorForWebview({ message: "Error 404: Model not found" }, "nexus", "nexus-free/glm-5")

		const parsed = JSON.parse(payload)
		expect(parsed.code).toBe("nexus_free_promotion_ended")
		expect(parsed.modelId).toBe("nexus-free/glm-5")
		expect(parsed.providerId).toBe("nexus")
		expect(parsed.details?.code).toBe("nexus_free_promotion_ended")
	})

	it("keeps the selected provider id, so nexus-pass selections stay attributed", () => {
		const payload = reshapeErrorForWebview({ message: "Model not found" }, "nexus-pass", "nexus-free/glm-5")

		expect(JSON.parse(payload).providerId).toBe("nexus-pass")
	})

	it("round-trips into the webview's NexusFreePromotionEnded classification", () => {
		const payload = reshapeErrorForWebview({ message: "Error 404: Model not found" }, "nexus", "nexus-free/glm-5")

		const nexusError = NexusError.parse(payload)
		expect(nexusError && NexusError.getErrorType(nexusError)).toBe(NexusErrorType.NexusFreePromotionEnded)
	})

	it("leaves model-not-found for a paid model on the generic guidance path", () => {
		const payload = reshapeErrorForWebview({ message: "Model not found" }, "nexus", "deepseek/deepseek-v4-flash")

		expect(payload).toBe(
			"Model not found This model may be retired or unavailable on your account. Switch to a different model in API Configuration settings, then retry.",
		)
	})

	it("leaves model-not-found on the generic guidance path when the model id is unknown", () => {
		const payload = reshapeErrorForWebview({ message: "Model not found" }, "nexus")

		expect(payload).toContain("This model may be retired or unavailable")
	})

	it("does not touch unrelated errors from a nexus-free model", () => {
		expect(reshapeErrorForWebview({ message: "socket hang up" }, "nexus", "nexus-free/glm-5")).toBe("socket hang up")
	})
})
