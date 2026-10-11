import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ProviderSettingsManager } from "@nexus/core";
import { afterEach, describe, expect, it } from "vitest";
import {
	getPersistedProviderApiKey,
	isProviderConfigured,
} from "../../../utils/provider-auth";
import {
	buildNexusPassSubscriptionPageUrl,
	resolveOAuthWaitKeyAction,
	saveManualProviderApiKey,
} from "./provider-picker-helpers";

describe("resolveOAuthWaitKeyAction", () => {
	it("switches to manual API key entry on K when the fallback is available", () => {
		expect(resolveOAuthWaitKeyAction({ name: "k" }, true)).toBe("use_api_key");
	});

	it("cancels on K when the fallback is not available", () => {
		expect(resolveOAuthWaitKeyAction({ name: "k" }, false)).toBe("cancel");
	});

	it("cancels on any other unmodified key so users are never stuck waiting on a browser flow", () => {
		for (const name of ["escape", "q", "return", "space", "up", "x"]) {
			expect(resolveOAuthWaitKeyAction({ name }, true)).toBe("cancel");
			expect(resolveOAuthWaitKeyAction({ name }, false)).toBe("cancel");
		}
	});

	it("ignores modifier-held keys so holding Cmd/Ctrl to click the auth link never cancels", () => {
		expect(resolveOAuthWaitKeyAction({ name: "k", ctrl: true }, true)).toBe(
			"ignore",
		);
		expect(resolveOAuthWaitKeyAction({ name: "c", ctrl: true }, false)).toBe(
			"ignore",
		);
		expect(resolveOAuthWaitKeyAction({ name: "x", meta: true }, true)).toBe(
			"ignore",
		);
		expect(resolveOAuthWaitKeyAction({ name: "x", super: true }, false)).toBe(
			"ignore",
		);
		// A bare modifier press (empty name) is ignored, not a cancel.
		expect(resolveOAuthWaitKeyAction({ name: "" }, true)).toBe("ignore");
	});
});

describe("buildNexusPassSubscriptionPageUrl", () => {
	it("opens the personal subscription page on production by default", () => {
		expect(
			buildNexusPassSubscriptionPageUrl(undefined).startsWith(
				"https://app.nexus.bot/dashboard/subscription?personal=true",
			),
		).toBe(true);
	});

	it("keeps the configured app base URL", () => {
		expect(
			buildNexusPassSubscriptionPageUrl(
				"https://staging-app.nexus.bot",
			).startsWith(
				"https://staging-app.nexus.bot/dashboard/subscription?personal=true",
			),
		).toBe(true);
	});
});

describe("saveManualProviderApiKey", () => {
	const tempDirs: string[] = [];

	afterEach(() => {
		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { force: true, recursive: true });
		}
	});

	function createManager(): ProviderSettingsManager {
		const dir = mkdtempSync(join(tmpdir(), "nexus-cli-provider-picker-"));
		tempDirs.push(dir);
		return new ProviderSettingsManager({
			filePath: join(dir, "providers.json"),
		});
	}

	it("clears stored OAuth tokens so the manual key takes effect", () => {
		const manager = createManager();
		manager.saveProviderSettings({
			provider: "nexus",
			auth: {
				accessToken: "stale-access-token",
				refreshToken: "stale-refresh-token",
				accountId: "acct_123",
			},
		});

		saveManualProviderApiKey(manager, "nexus", "manual-api-key");

		const settings = manager.getProviderSettings("nexus");
		expect(settings?.apiKey).toBe("manual-api-key");
		expect(settings?.auth?.accessToken).toBeUndefined();
		expect(settings?.auth?.refreshToken).toBeUndefined();
		expect(settings?.auth?.accountId).toBe("acct_123");
		expect(getPersistedProviderApiKey("nexus", settings)).toBe(
			"manual-api-key",
		);
		expect(isProviderConfigured("nexus", settings)).toBe(true);
	});

	it("saves nexus-pass keys to the shared nexus auth storage entry", () => {
		const manager = createManager();
		manager.saveProviderSettings({
			provider: "nexus",
			auth: {
				accessToken: "stale-access-token",
				refreshToken: "stale-refresh-token",
			},
		});

		saveManualProviderApiKey(manager, "nexus-pass", "manual-api-key");

		// nexus-pass inherits auth storage from the "nexus" entry, so the key
		// must land there and the stale tokens must be gone for both providers.
		const nexusSettings = manager.getProviderSettings("nexus");
		expect(nexusSettings?.apiKey).toBe("manual-api-key");
		expect(nexusSettings?.auth?.accessToken).toBeUndefined();

		const nexusPassSettings = manager.getProviderSettings("nexus-pass");
		expect(getPersistedProviderApiKey("nexus-pass", nexusPassSettings)).toBe(
			"manual-api-key",
		);
		expect(isProviderConfigured("nexus-pass", nexusPassSettings)).toBe(true);
	});

	it("clears stale credentials copied into a direct nexus-pass entry", () => {
		const manager = createManager();
		manager.saveProviderSettings({
			provider: "nexus",
			auth: {
				accessToken: "stale-access-token",
				refreshToken: "stale-refresh-token",
			},
		});
		// Provider switching copies the merged settings (including auth) into
		// a direct nexus-pass entry, which shadows the shared "nexus" entry.
		manager.saveProviderSettings({
			provider: "nexus-pass",
			apiKey: "stale-copied-key",
			auth: {
				accessToken: "stale-access-token",
				refreshToken: "stale-refresh-token",
			},
		});

		saveManualProviderApiKey(manager, "nexus-pass", "manual-api-key");

		const nexusPassSettings = manager.getProviderSettings("nexus-pass");
		expect(nexusPassSettings?.auth?.accessToken).toBeUndefined();
		expect(getPersistedProviderApiKey("nexus-pass", nexusPassSettings)).toBe(
			"manual-api-key",
		);
	});
});
