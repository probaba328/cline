import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	NEXUS_ENVIRONMENT_ENV,
	NEXUS_ENVIRONMENT_OVERRIDE_ENV,
	NEXUS_ENVIRONMENTS,
	DEFAULT_NEXUS_ENVIRONMENT,
	getNexusEnvironmentConfig,
	resolveNexusEnvironment,
} from "./nexus-environment";

const ENV_KEYS = [
	NEXUS_ENVIRONMENT_ENV,
	NEXUS_ENVIRONMENT_OVERRIDE_ENV,
	"NEXUS_API_BASE_URL",
] as const;

const originalEnvValues = Object.fromEntries(
	ENV_KEYS.map((key) => [key, process.env[key]]),
);

beforeEach(() => {
	vi.unstubAllGlobals();
	for (const key of ENV_KEYS) {
		delete process.env[key];
	}
});

afterEach(() => {
	vi.unstubAllGlobals();
	for (const key of ENV_KEYS) {
		const value = originalEnvValues[key];
		if (typeof value === "string") {
			process.env[key] = value;
		} else {
			delete process.env[key];
		}
	}
});

describe("resolveNexusEnvironment", () => {
	it("defaults to production when no env var is set", () => {
		expect(resolveNexusEnvironment()).toBe(DEFAULT_NEXUS_ENVIRONMENT);
	});

	it("reads NEXUS_ENVIRONMENT from process.env", () => {
		process.env[NEXUS_ENVIRONMENT_ENV] = "staging";
		expect(resolveNexusEnvironment()).toBe("staging");

		process.env[NEXUS_ENVIRONMENT_ENV] = "local";
		expect(resolveNexusEnvironment()).toBe("local");
	});

	it("prefers NEXUS_ENVIRONMENT_OVERRIDE over NEXUS_ENVIRONMENT", () => {
		process.env[NEXUS_ENVIRONMENT_OVERRIDE_ENV] = "local";
		process.env[NEXUS_ENVIRONMENT_ENV] = "staging";

		expect(resolveNexusEnvironment()).toBe("local");
	});

	it("normalizes case and surrounding whitespace", () => {
		process.env[NEXUS_ENVIRONMENT_ENV] = "  STAGING  ";

		expect(resolveNexusEnvironment()).toBe("staging");
	});

	it("ignores unknown values and falls through to the next source", () => {
		process.env[NEXUS_ENVIRONMENT_OVERRIDE_ENV] = "qa";
		process.env[NEXUS_ENVIRONMENT_ENV] = "staging";
		expect(resolveNexusEnvironment()).toBe("staging");

		delete process.env[NEXUS_ENVIRONMENT_OVERRIDE_ENV];
		process.env[NEXUS_ENVIRONMENT_ENV] = "qa";
		expect(resolveNexusEnvironment()).toBe(DEFAULT_NEXUS_ENVIRONMENT);
	});

	it("defaults to production when process is unavailable", () => {
		vi.stubGlobal("process", undefined);

		expect(resolveNexusEnvironment()).toBe(DEFAULT_NEXUS_ENVIRONMENT);
	});
});

describe("getNexusEnvironmentConfig", () => {
	it("returns the config for an explicit environment", () => {
		expect(getNexusEnvironmentConfig("staging")).toBe(
			NEXUS_ENVIRONMENTS.staging,
		);
		expect(getNexusEnvironmentConfig("local")).toBe(NEXUS_ENVIRONMENTS.local);
		expect(getNexusEnvironmentConfig("production")).toBe(
			NEXUS_ENVIRONMENTS.production,
		);
	});

	it("falls back to production by default", () => {
		expect(getNexusEnvironmentConfig()).toBe(NEXUS_ENVIRONMENTS.production);
	});

	it("uses the resolved process.env environment when no explicit environment is provided", () => {
		process.env[NEXUS_ENVIRONMENT_ENV] = "staging";

		expect(getNexusEnvironmentConfig()).toBe(NEXUS_ENVIRONMENTS.staging);
	});

	it("applies NEXUS_API_BASE_URL without mutating the catalog config", () => {
		process.env.NEXUS_API_BASE_URL = "http://127.0.0.1:3000";

		expect(getNexusEnvironmentConfig("local")).toEqual({
			...NEXUS_ENVIRONMENTS.local,
			apiBaseUrl: "http://127.0.0.1:3000",
			mcpBaseUrl: "http://127.0.0.1:3000/v1/mcp",
		});
		expect(NEXUS_ENVIRONMENTS.local.apiBaseUrl).toBe("http://localhost:7777");
	});

	it("defaults to production when process is unavailable", () => {
		vi.stubGlobal("process", undefined);

		expect(getNexusEnvironmentConfig()).toBe(NEXUS_ENVIRONMENTS.production);
	});
});

describe("NEXUS_ENVIRONMENTS catalog", () => {
	it("exposes an environment field that matches its key", () => {
		for (const [key, config] of Object.entries(NEXUS_ENVIRONMENTS)) {
			expect(config.environment).toBe(key);
		}
	});

	it("populates appBaseUrl, apiBaseUrl, and mcpBaseUrl for every environment", () => {
		for (const config of Object.values(NEXUS_ENVIRONMENTS)) {
			expect(config.appBaseUrl).toMatch(/^https?:\/\//);
			expect(config.apiBaseUrl).toMatch(/^https?:\/\//);
			expect(config.mcpBaseUrl).toMatch(/^https?:\/\//);
		}
	});
});
