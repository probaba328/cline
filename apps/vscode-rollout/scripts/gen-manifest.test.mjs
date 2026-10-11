import { describe, expect, it } from "bun:test";
import { generateManifest } from "./gen-manifest.mjs";

const shared = {
	name: "claude-dev",
	publisher: "saoudrizwan",
	main: "./dist/extension.js",
	engines: { vscode: "^1.84.0" },
	displayName: "Nexus",
};

function pkg(overrides) {
	return {
		...shared,
		activationEvents: ["onStartupFinished"],
		contributes: {
			viewsContainers: {
				activitybar: [{ id: "c", title: "Nexus", icon: "assets/icon.svg" }],
			},
			views: { c: [{ type: "webview", id: "claude-dev.SidebarProvider" }] },
			commands: [],
			keybindings: [],
			menus: {},
			icons: {},
			...overrides.contributes,
		},
		...Object.fromEntries(
			Object.entries(overrides).filter(([k]) => k !== "contributes"),
		),
	};
}

describe("generateManifest", () => {
	it("unions commands, menus, keybindings and activation events", () => {
		const next = pkg({
			contributes: {
				commands: [
					{ command: "nexus.a", title: "A" },
					{ command: "nexus.shared", title: "S" },
				],
				menus: { "view/title": [{ command: "nexus.a", when: "x" }] },
			},
		});
		const legacy = pkg({
			activationEvents: ["onStartupFinished", "workspaceContains:evals.env"],
			contributes: {
				commands: [
					{ command: "nexus.b", title: "B" },
					{ command: "nexus.shared", title: "S" },
				],
				menus: {
					"view/title": [{ command: "nexus.b", when: "y" }],
					"comments/commentThread/title": [{ command: "nexus.b" }],
				},
				keybindings: [{ command: "nexus.b", key: "ctrl+k" }],
			},
		});
		const manifest = generateManifest(next, legacy, "4.1.0");
		expect(manifest.version).toBe("4.1.0");
		expect(manifest.main).toBe("./extension.js");
		expect(manifest.contributes.commands.map((c) => c.command).sort()).toEqual([
			"nexus.a",
			"nexus.b",
			"nexus.shared",
		]);
		expect(manifest.contributes.menus["view/title"]).toHaveLength(2);
		expect(
			manifest.contributes.menus["comments/commentThread/title"],
		).toHaveLength(1);
		expect(manifest.contributes.keybindings).toHaveLength(1);
		expect(manifest.activationEvents).toContain("workspaceContains:evals.env");
	});

	it("gates cohort-exclusive menu entries and keybindings on the context key", () => {
		const next = pkg({
			contributes: {
				commands: [
					{ command: "nexus.a", title: "A" },
					{ command: "nexus.shared", title: "S" },
				],
				menus: {
					"view/title": [
						{ command: "nexus.a", when: "x" },
						{ command: "nexus.shared", when: "v" },
					],
				},
			},
		});
		const legacy = pkg({
			contributes: {
				commands: [
					{ command: "nexus.b", title: "B" },
					{ command: "nexus.shared", title: "S" },
				],
				menus: {
					"view/title": [
						{ command: "nexus.b", when: "y" },
						{ command: "nexus.shared", when: "v" },
					],
				},
				keybindings: [{ command: "nexus.b", key: "ctrl+k", when: "focus" }],
			},
		});
		const manifest = generateManifest(next, legacy, "4.1.0");
		const viewTitle = manifest.contributes.menus["view/title"];
		expect(viewTitle.find((e) => e.command === "nexus.a").when).toBe(
			"(x) && nexus.sdkBundle",
		);
		expect(viewTitle.find((e) => e.command === "nexus.b").when).toBe(
			"(y) && !nexus.sdkBundle",
		);
		expect(viewTitle.find((e) => e.command === "nexus.shared").when).toBe("v");
		expect(manifest.contributes.keybindings[0].when).toBe(
			"(focus) && !nexus.sdkBundle",
		);
	});

	it("hides cohort-exclusive commands from the other cohort's palette", () => {
		const next = pkg({
			contributes: {
				commands: [
					{ command: "nexus.nextOnly", title: "N" },
					{ command: "nexus.shared", title: "S" },
				],
			},
		});
		const legacy = pkg({
			contributes: {
				commands: [
					{ command: "nexus.legacyOnly", title: "L" },
					{ command: "nexus.shared", title: "S" },
				],
			},
		});
		const palette = generateManifest(next, legacy, "4.1.0").contributes.menus
			.commandPalette;
		expect(palette).toContainEqual({
			command: "nexus.nextOnly",
			when: "nexus.sdkBundle",
		});
		expect(palette).toContainEqual({
			command: "nexus.legacyOnly",
			when: "!nexus.sdkBundle",
		});
		expect(palette.find((e) => e.command === "nexus.shared")).toBeUndefined();
	});

	it("leaves commands alone when a bundle already declares a palette entry for them", () => {
		const next = pkg({
			contributes: { commands: [{ command: "nexus.shared", title: "S" }] },
		});
		const legacy = pkg({
			contributes: {
				commands: [
					{ command: "nexus.hidden", title: "H" },
					{ command: "nexus.shared", title: "S" },
				],
				menus: { commandPalette: [{ command: "nexus.hidden", when: "false" }] },
			},
		});
		const palette = generateManifest(next, legacy, "4.1.0").contributes.menus
			.commandPalette;
		expect(palette.filter((e) => e.command === "nexus.hidden")).toEqual([
			{ command: "nexus.hidden", when: "(false) && !nexus.sdkBundle" },
		]);
	});

	it("dedupes structurally identical menu entries", () => {
		const entry = { command: "nexus.a", when: "view == nexus" };
		const next = pkg({
			contributes: {
				commands: [{ command: "nexus.a", title: "A" }],
				menus: { "view/title": [entry] },
			},
		});
		const legacy = pkg({
			contributes: {
				commands: [{ command: "nexus.a", title: "A" }],
				menus: { "view/title": [{ ...entry }] },
			},
		});
		expect(
			generateManifest(next, legacy, "1.0.0").contributes.menus["view/title"],
		).toHaveLength(1);
	});

	it("rejects diverged views/viewsContainers", () => {
		const next = pkg({});
		const legacy = pkg({
			contributes: { views: { c: [{ type: "webview", id: "other" }] } },
		});
		expect(() => generateManifest(next, legacy, "1.0.0")).toThrow(/views/);
	});

	it("rejects structurally diverged walkthroughs", () => {
		const walkthrough = (stepId, media) => ({
			contributes: {
				walkthroughs: [
					{
						id: "NexusWalkthrough",
						title: "Meet Nexus",
						steps: [{ id: stepId, title: "Start here", media }],
					},
				],
			},
		});
		expect(() =>
			generateManifest(
				pkg(walkthrough("welcome", { markdown: "walkthrough/step1.md" })),
				pkg(walkthrough("hello", { markdown: "walkthrough/step1.md" })),
				"1.0.0",
			),
		).toThrow(/walkthroughs diverged structurally/);
		expect(() =>
			generateManifest(
				pkg(walkthrough("welcome", { markdown: "walkthrough/step1.md" })),
				pkg(walkthrough("welcome", { markdown: "walkthrough/other.md" })),
				"1.0.0",
			),
		).toThrow(/walkthroughs diverged structurally/);
	});

	it("tolerates copy-only walkthrough divergence, shipping next's text", () => {
		const walkthrough = (description) => ({
			contributes: {
				walkthroughs: [
					{
						id: "NexusWalkthrough",
						title: "Meet Nexus",
						steps: [
							{
								id: "welcome",
								title: "Start here",
								description,
								media: { markdown: "walkthrough/step1.md" },
							},
						],
					},
				],
			},
		});
		const manifest = generateManifest(
			pkg(walkthrough("Connect via MCP.")),
			pkg(walkthrough("Discover the MCP Marketplace.")),
			"1.0.0",
		);
		expect(manifest.contributes.walkthroughs[0].steps[0].description).toBe(
			"Connect via MCP.",
		);
	});

	it("rejects diverged configuration", () => {
		const next = pkg({
			contributes: {
				configuration: {
					title: "Nexus",
					properties: {
						"nexus.enabled": { type: "boolean", default: false },
					},
				},
			},
		});
		const legacy = pkg({
			contributes: {
				configuration: {
					title: "Nexus",
					properties: {
						"nexus.enabled": { type: "boolean", default: 0 },
					},
				},
			},
		});
		expect(() => generateManifest(next, legacy, "1.0.0")).toThrow(
			/contributes\.configuration diverged/,
		);
	});

	it("injects the loader-owned bundleOverride setting into the union", () => {
		const manifest = generateManifest(pkg({}), pkg({}), "4.1.0");
		const prop =
			manifest.contributes.configuration.properties[
				"nexus.rollout.bundleOverride"
			];
		expect(prop).toBeDefined();
		expect(prop.enum).toEqual(["auto", "next", "legacy"]);
		expect(prop.default).toBe("auto");
		expect(prop.scope).toBe("application");
	});

	it("rejects bundles that declare the loader-owned setting themselves", () => {
		const withClash = {
			contributes: {
				configuration: {
					title: "Nexus",
					properties: { "nexus.rollout.bundleOverride": { type: "string" } },
				},
			},
		};
		expect(() =>
			generateManifest(pkg(withClash), pkg(withClash), "4.1.0"),
		).toThrow(/loader-owned setting/);
	});

	it("derives gates and the injected setting from the nightly identity", () => {
		const nightly = (overrides) => ({
			...pkg(overrides),
			name: "nexus-nightly",
			displayName: "Nexus (Nightly)",
		});
		const next = nightly({
			contributes: {
				commands: [{ command: "nexus-nightly.nextOnly", title: "N" }],
				menus: {
					"view/title": [{ command: "nexus-nightly.nextOnly", when: "x" }],
				},
			},
		});
		const legacy = nightly({
			contributes: {
				commands: [{ command: "nexus-nightly.legacyOnly", title: "L" }],
				keybindings: [{ command: "nexus-nightly.legacyOnly", key: "ctrl+k" }],
			},
		});
		const manifest = generateManifest(next, legacy, "4.0.1752600000");
		expect(manifest.name).toBe("nexus-nightly");
		expect(manifest.contributes.menus["view/title"][0].when).toBe(
			"(x) && nexus-nightly.sdkBundle",
		);
		expect(manifest.contributes.keybindings[0].when).toBe(
			"!nexus-nightly.sdkBundle",
		);
		expect(manifest.contributes.menus.commandPalette).toContainEqual({
			command: "nexus-nightly.legacyOnly",
			when: "!nexus-nightly.sdkBundle",
		});
		const properties = manifest.contributes.configuration.properties;
		expect(properties["nexus-nightly.rollout.bundleOverride"]).toBeDefined();
		expect(properties["nexus.rollout.bundleOverride"]).toBeUndefined();
	});

	it("unions diverged engines to the newer requirement (either direction)", () => {
		const olderLegacy = { ...pkg({}), engines: { vscode: "^1.74.0" } };
		expect(generateManifest(pkg({}), olderLegacy, "1.0.0").engines).toEqual({
			vscode: "^1.84.0",
		});
		const newerLegacy = { ...pkg({}), engines: { vscode: "^1.101.0" } };
		expect(generateManifest(pkg({}), newerLegacy, "1.0.0").engines).toEqual({
			vscode: "^1.101.0",
		});
	});

	it("rejects diverged engines it cannot compare", () => {
		const legacy = { ...pkg({}), engines: { vscode: ">=1.84.0 <2.0.0" } };
		expect(() => generateManifest(pkg({}), legacy, "1.0.0")).toThrow(
			/uncomparable/,
		);
	});

	it("rejects conflicting icon definitions", () => {
		const next = pkg({
			contributes: {
				icons: {
					"nexus-logo": {
						description: "d",
						default: { fontPath: "a.woff", fontCharacter: "\\E900" },
					},
				},
			},
		});
		const legacy = pkg({
			contributes: {
				icons: {
					"nexus-logo": {
						description: "d",
						default: { fontPath: "b.woff", fontCharacter: "\\E900" },
					},
				},
			},
		});
		expect(() => generateManifest(next, legacy, "1.0.0")).toThrow(/icons/);
	});
});
