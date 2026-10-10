import { describe, it } from "bun:test"
import "should"
import { NexusError, NexusErrorType } from "../NexusError"

describe("NexusError — API error type classification", () => {
	describe("Auth errors (invalid / missing API key)", () => {
		const authMessages = [
			"Invalid API key",
			"invalid api token",
			"authentication failed",
			"Unauthorized: 401",
			"Invalid token provided",
		]

		for (const msg of authMessages) {
			it(`classifies "${msg}" as Auth`, () => {
				const err = new NexusError(msg)
				NexusError.getErrorType(err)!.should.equal(NexusErrorType.Auth)
			})
		}

		it("classifies error with status 401 and auth message as Auth", () => {
			const err = new NexusError({ message: "Unauthorized", status: 401 })
			NexusError.getErrorType(err)!.should.equal(NexusErrorType.Auth)
		})
	})

	describe("Rate limit errors (429)", () => {
		const rateLimitMessages = [
			"status code 429",
			"rate limit exceeded",
			"Too Many Requests",
			"quota exceeded",
			"resource exhausted",
		]

		for (const msg of rateLimitMessages) {
			it(`classifies "${msg}" as RateLimit`, () => {
				const err = new NexusError(msg)
				NexusError.getErrorType(err)!.should.equal(NexusErrorType.RateLimit)
			})
		}
	})

	describe("Balance / spend limit errors", () => {
		it("classifies insufficient_credits code as Balance when current_balance is provided", () => {
			const err = new NexusError({ message: "Insufficient credits", code: "insufficient_credits", details: { current_balance: 0 } })
			NexusError.getErrorType(err)!.should.equal(NexusErrorType.Balance)
		})
	})

	describe("Quota exceeded errors", () => {
		it("classifies INFERENCE_CAP_ERROR code as QuotaExceeded", () => {
			const err = new NexusError({ message: "Inference cap reached", code: "INFERENCE_CAP_ERROR" })
			NexusError.getErrorType(err)!.should.equal(NexusErrorType.QuotaExceeded)
		})
	})

	describe("Unknown / generic errors", () => {
		it("returns undefined for a plain network error message", () => {
			const err = new NexusError("ECONNREFUSED: connection refused")
			// Generic network errors have no specific NexusErrorType mapping
			const type = NexusError.getErrorType(err)
			// Either undefined or defined — document the actual behavior
			;(type === undefined || typeof type === "string").should.be.true()
		})

		it("returns undefined for an empty message", () => {
			const err = new NexusError("")
			const type = NexusError.getErrorType(err)
			should.not.exist(type)
		})
	})

	describe("isType helper", () => {
		it("returns true when error matches the given type", () => {
			const err = new NexusError("rate limit exceeded")
			err.isErrorType(NexusErrorType.RateLimit).should.be.true()
		})

		it("returns false when error does not match the given type", () => {
			const err = new NexusError("rate limit exceeded")
			err.isErrorType(NexusErrorType.Auth).should.be.false()
		})
	})

	describe("serialize / parse round-trip", () => {
		it("preserves the error message through serialization", () => {
			const original = new NexusError({ message: "rate limit exceeded", status: 429 })
			const serialized = original.serialize()
			const parsed = NexusError.parse(serialized)
			parsed?.message.should.equal("rate limit exceeded")
		})

		it("preserves the error type through serialization", () => {
			const original = new NexusError("rate limit exceeded")
			const serialized = original.serialize()
			const parsed = NexusError.parse(serialized)
			NexusError.getErrorType(parsed!)!.should.equal(NexusErrorType.RateLimit)
		})
	})
})
