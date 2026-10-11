import { describe, it } from "bun:test"
import "should"
import { NexusError, NexusErrorType } from "../NexusError"

describe("NexusError", () => {
	describe("getErrorType", () => {
		it("should return QuotaExceeded when code is INFERENCE_CAP_ERROR", () => {
			const err = new NexusError({ message: "Inference cap reached", code: "INFERENCE_CAP_ERROR" })
			NexusError.getErrorType(err)!.should.equal(NexusErrorType.QuotaExceeded)
		})

		it("should return Entitlement for the SDK NexusPass subscription message", () => {
			const err = new NexusError(
				"No access to NexusPass subscription models yet. Subscribe to NexusPass, the low cost open weights model coding plan:",
			)

			NexusError.getErrorType(err)!.should.equal(NexusErrorType.Entitlement)
		})

		it("should return Entitlement for the SDK NexusPass subscription message with a different app URL", () => {
			const err = new NexusError(
				"No access to NexusPass subscription models yet. Subscribe to NexusPass, the low cost open weights model coding plan:",
			)

			NexusError.getErrorType(err)!.should.equal(NexusErrorType.Entitlement)
		})

		it("should return Entitlement for the raw required-plan message", () => {
			const err = new NexusError("403 Error 403: the user is not subscribed to required model plan")

			NexusError.getErrorType(err)!.should.equal(NexusErrorType.Entitlement)
		})

		it("should classify the SDK org individual subscription message separately", () => {
			const err = new NexusError(
				"Organization accounts cannot use NexusPass subscriptions. Go to /account -> change account to switch to your personal account for NexusPass",
			)

			NexusError.getErrorType(err)!.should.equal(NexusErrorType.OrgNexusPassRestriction)
		})

		it("should classify the raw organization individual subscription message separately", () => {
			const err = new NexusError("403 Error 403: organization accounts cannot use individual model inference subscriptions")

			NexusError.getErrorType(err)!.should.equal(NexusErrorType.OrgNexusPassRestriction)
		})

		it("should classify NexusPass period limit messages separately", () => {
			const err = new NexusError(
				"You have reached your weekly Nexuspass limit. The limit resets in 7d, please try again later.",
			)

			NexusError.getErrorType(err)!.should.equal(NexusErrorType.NexusPassLimit)
		})

		it("should classify nested NexusPass period limit messages separately", () => {
			const err = new NexusError({
				message: "403 Error 403",
				error: {
					message: "You have reached your monthly NexusPass limit. The limit resets in 12h, please try again later.",
				},
			})

			NexusError.getErrorType(err)!.should.equal(NexusErrorType.NexusPassLimit)
		})

		it("should classify daily Nexus free model limits separately", () => {
			const err = new NexusError(
				"Error: Error 429: Daily free limit reached on model deepseek/deepseek-v4-flash. Try again in 23h 59m",
			)

			NexusError.getErrorType(err)!.should.equal(NexusErrorType.NexusFreeModelLimit)
		})

		it("should classify the host-stamped promotion-ended code as NexusFreePromotionEnded", () => {
			// reshapeErrorForWebview stamps this code when the active model is a
			// retired nexus-free/ id (see message-translator).
			const err = new NexusError({
				message: "Model not found",
				code: "nexus_free_promotion_ended",
			})

			NexusError.getErrorType(err)!.should.equal(NexusErrorType.NexusFreePromotionEnded)
		})

		it("should classify model-not-found for a nexus-free model as NexusFreePromotionEnded", () => {
			const err = new NexusError({ message: "Error 404: Model not found" }, "nexus-free/glm-5")

			NexusError.getErrorType(err)!.should.equal(NexusErrorType.NexusFreePromotionEnded)
		})

		it("should prefer NexusFreePromotionEnded over Auth for a 404 with a nexus-free model", () => {
			// A 404 falls inside the generic 401-428 auth-status range; the
			// promotion-ended classification must win.
			const err = new NexusError({ message: "Error 404: Model not found", status: 404 }, "nexus-free/glm-5")

			const result = NexusError.getErrorType(err)
			result!.should.equal(NexusErrorType.NexusFreePromotionEnded)
		})

		it("should keep model-not-found for a non-free model on the generic path", () => {
			const err = new NexusError({ message: "Error 404: Model not found", status: 404 }, "deepseek/deepseek-v4-flash")

			const result = NexusError.getErrorType(err)
			;(result !== NexusErrorType.NexusFreePromotionEnded).should.be.true()
		})

		it("should not classify unrelated nexus-free errors as NexusFreePromotionEnded", () => {
			const err = new NexusError({ message: "Network error: socket hang up" }, "nexus-free/glm-5")

			const result = NexusError.getErrorType(err)
			;(result !== NexusErrorType.NexusFreePromotionEnded).should.be.true()
		})
	})
})
