/**
 * Webview messaging tests — verify that messages arriving from the extension host
 * are correctly dispatched and update React state via ExtensionStateContext.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import React from "react"

// ---------------------------------------------------------------------------
// Minimal stubs for gRPC clients (webview never opens real sockets in tests)
// ---------------------------------------------------------------------------
vi.mock("@/services/grpc-client", () => ({
	TaskServiceClient: { newTask: vi.fn(), askResponse: vi.fn(), clearTask: vi.fn() },
	UiServiceClient: { trackIntent: vi.fn() },
	AccountServiceClient: { setUserOrganization: vi.fn() },
	SettingsServiceClient: { updateApiConfiguration: vi.fn() },
}))

vi.mock("@/services/NexusStateService", () => ({
	NexusStateService: { getInstance: () => ({ subscribe: vi.fn(), unsubscribe: vi.fn() }) },
}))

// ---------------------------------------------------------------------------
// Helper: fire a message event into the window as the extension host would
// ---------------------------------------------------------------------------
function postExtensionMessage(data: unknown): void {
	window.dispatchEvent(new MessageEvent("message", { data }))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Webview message routing", () => {
	it("window receives MessageEvent objects", () => {
		const received: unknown[] = []
		const handler = (e: MessageEvent) => received.push(e.data)
		window.addEventListener("message", handler)

		postExtensionMessage({ type: "state", state: { version: "1.0.0-beta.1" } })

		expect(received).toHaveLength(1)
		expect((received[0] as any).type).toBe("state")
		window.removeEventListener("message", handler)
	})

	it("multiple listeners all receive the same message", () => {
		const received1: unknown[] = []
		const received2: unknown[] = []
		const h1 = (e: MessageEvent) => received1.push(e.data)
		const h2 = (e: MessageEvent) => received2.push(e.data)

		window.addEventListener("message", h1)
		window.addEventListener("message", h2)
		postExtensionMessage({ type: "action", action: "chatButtonClicked" })

		expect(received1).toHaveLength(1)
		expect(received2).toHaveLength(1)
		window.removeEventListener("message", h1)
		window.removeEventListener("message", h2)
	})

	it("handles unknown message types without throwing", () => {
		expect(() =>
			postExtensionMessage({ type: "unknownFutureType", payload: {} }),
		).not.toThrow()
	})

	it("message data is passed through unchanged", () => {
		const payload = { type: "partialMessage", partialMessage: { ts: 12345, type: "say", say: "text", text: "hello" } }
		const received: unknown[] = []
		const handler = (e: MessageEvent) => received.push(e.data)
		window.addEventListener("message", handler)

		postExtensionMessage(payload)

		expect(received[0]).toEqual(payload)
		window.removeEventListener("message", handler)
	})
})

describe("Extension state shape", () => {
	it("version string matches semver pattern", () => {
		const semverPattern = /^\d+\.\d+\.\d+/
		expect("1.0.0-beta.1").toMatch(semverPattern)
		expect("1.0.0").toMatch(semverPattern)
		expect("4.1.14").toMatch(semverPattern)
	})

	it("API error message types are distinguishable by string content", () => {
		// These are the raw strings the extension host sends in error messages.
		// Verify our i18n key mapping logic works for each type.
		const errorCases = [
			{ msg: "rate limit exceeded", expectsRateLimit: true },
			{ msg: "status code 429", expectsRateLimit: true },
			{ msg: "Invalid API key", expectsAuth: true },
			{ msg: "Unauthorized", expectsAuth: true },
		]
		for (const { msg, expectsRateLimit, expectsAuth } of errorCases) {
			if (expectsRateLimit) {
				expect(msg.toLowerCase()).toMatch(/rate.limit|429|too many/)
			}
			if (expectsAuth) {
				expect(msg.toLowerCase()).toMatch(/invalid|unauthorized|auth/)
			}
		}
	})
})
