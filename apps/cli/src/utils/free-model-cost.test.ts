import type { AgentEvent } from "@nexus/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	clearNexusFreeModelCostCache,
	shouldZeroNexusFreeModelCost,
	zeroCliAgentEventCost,
	zeroCliUsageCost,
} from "./free-model-cost";

afterEach(() => {
	clearNexusFreeModelCostCache();
	vi.unstubAllGlobals();
});

describe("shouldZeroNexusFreeModelCost", () => {
	it("uses the Nexus free model list", async () => {
		const fetchMock = vi.fn(
			async (_input: Parameters<typeof fetch>[0], _init?: RequestInit) => {
				return new Response(
					JSON.stringify({
						free: [{ id: "deepseek/deepseek-v4-flash" }],
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			},
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			shouldZeroNexusFreeModelCost({
				providerId: "nexus",
				modelId: "deepseek/deepseek-v4-flash",
				baseUrl: "https://nexus.test/api/v1",
			}),
		).resolves.toBe(true);

		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			"https://nexus.test/api/v1/ai/nexus/recommended-models",
		);
	});

	it("matches nexus-free model ids from the free endpoint bucket exactly", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(
					JSON.stringify({
						free: [{ id: "nexus-free/deepseek-v4-flash" }],
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		await expect(
			shouldZeroNexusFreeModelCost({
				providerId: "nexus",
				modelId: "nexus-free/deepseek-v4-flash",
				baseUrl: "https://nexus.test/api/v1",
			}),
		).resolves.toBe(true);

		await expect(
			shouldZeroNexusFreeModelCost({
				providerId: "nexus-pass",
				modelId: "deepseek-v4-flash",
				baseUrl: "https://nexus.test/api/v1",
			}),
		).resolves.toBe(false);
	});

	it("does not zero non-Nexus providers", async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			shouldZeroNexusFreeModelCost({
				providerId: "openrouter",
				modelId: "deepseek/deepseek-v4-flash",
				baseUrl: "https://nexus.test/api/v1",
			}),
		).resolves.toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("zeros cost of free models selected on the nexus-pass provider", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(
					JSON.stringify({
						free: [{ id: "deepseek/deepseek-v4-flash" }],
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		await expect(
			shouldZeroNexusFreeModelCost({
				providerId: "nexus-pass",
				modelId: "deepseek/deepseek-v4-flash",
				baseUrl: "https://nexus.test/api/v1",
			}),
		).resolves.toBe(true);

		// subscription (nexus-pass/...) models are not in the free bucket
		await expect(
			shouldZeroNexusFreeModelCost({
				providerId: "nexus-pass",
				modelId: "nexus-pass/glm-5.1",
				baseUrl: "https://nexus.test/api/v1",
			}),
		).resolves.toBe(false);
	});

	it("does not match a paid model by only the final path segment", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(
					JSON.stringify({
						free: [{ id: "deepseek/deepseek-v4-flash" }],
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}),
		);

		await expect(
			shouldZeroNexusFreeModelCost({
				providerId: "nexus",
				modelId: "acme/deepseek-v4-flash",
				baseUrl: "https://nexus.test/api/v1",
			}),
		).resolves.toBe(false);
	});

	it("retries after a failed free model list fetch", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						free: [{ id: "deepseek/deepseek-v4-flash" }],
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				),
			);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			shouldZeroNexusFreeModelCost({
				providerId: "nexus",
				modelId: "deepseek/deepseek-v4-flash",
				baseUrl: "https://nexus.test/api/v1",
			}),
		).resolves.toBe(false);
		await expect(
			shouldZeroNexusFreeModelCost({
				providerId: "nexus",
				modelId: "deepseek/deepseek-v4-flash",
				baseUrl: "https://nexus.test/api/v1",
			}),
		).resolves.toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});

describe("zeroCliUsageCost", () => {
	it("zeros total cost while preserving token usage", () => {
		expect(
			zeroCliUsageCost(
				{
					inputTokens: 10,
					outputTokens: 5,
					totalCost: 0.001,
				},
				true,
			),
		).toEqual({
			inputTokens: 10,
			outputTokens: 5,
			totalCost: 0,
		});
	});
});

describe("zeroCliAgentEventCost", () => {
	it("zeros usage event cost fields", () => {
		const event = {
			type: "usage",
			inputTokens: 10,
			outputTokens: 5,
			cost: 0.001,
			totalCost: 0.001,
		} as AgentEvent;

		expect(zeroCliAgentEventCost(event, true)).toMatchObject({
			cost: 0,
			totalCost: 0,
		});
	});

	it("zeros done event usage cost", () => {
		const event = {
			type: "done",
			reason: "completed",
			text: "ok",
			iterations: 1,
			usage: {
				inputTokens: 10,
				outputTokens: 5,
				totalCost: 0.001,
			},
		} as AgentEvent;

		expect(zeroCliAgentEventCost(event, true)).toMatchObject({
			usage: { totalCost: 0 },
		});
	});
});
