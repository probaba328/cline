import { describe, expect, it } from "bun:test";
import { nightlifyPackageJson } from "./nightlify.mjs";

const fixture = {
	name: "claude-dev",
	displayName: "Nexus",
	publisher: "saoudrizwan",
	version: "4.0.0",
	main: "./dist/extension.js",
	contributes: {
		viewsContainers: {
			activitybar: [
				{
					id: "claude-dev-ActivityBar",
					title: "Nexus",
					icon: "assets/icon.svg",
				},
			],
		},
		views: {
			"claude-dev-ActivityBar": [
				{ type: "webview", id: "claude-dev.SidebarProvider" },
			],
		},
		commands: [{ command: "nexus.plusButtonClicked", title: "New Task" }],
		keybindings: [{ command: "nexus.addToChat", key: "ctrl+'" }],
		menus: {
			"view/title": [
				{
					command: "nexus.plusButtonClicked",
					when: "view == claude-dev.SidebarProvider",
				},
				// Mid-string references are NOT rewritten — a known limitation
				// shared with the standalone nightly's publish-nightly.mjs.
				{ command: "nexus.addToChat", when: "config.nexus.enableExtras" },
			],
		},
		configuration: {
			title: "Nexus",
			properties: { "nexus.enableExtras": { type: "boolean" } },
		},
	},
};

describe("nightlifyPackageJson", () => {
	const pkg = JSON.parse(
		nightlifyPackageJson(JSON.stringify(fixture, null, "\t"), "4.0.1752600000"),
	);

	it("sets the nightly identity and the supplied version", () => {
		expect(pkg.name).toBe("nexus-nightly");
		expect(pkg.displayName).toBe("Nexus (Nightly)");
		expect(pkg.version).toBe("4.0.1752600000");
		expect(pkg.publisher).toBe("saoudrizwan");
	});

	it("rewrites claude-dev IDs and the nexus.* namespace", () => {
		expect(pkg.contributes.viewsContainers.activitybar[0].id).toBe(
			"nexus-nightly-ActivityBar",
		);
		expect(pkg.contributes.viewsContainers.activitybar[0].title).toBe(
			"Nexus (Nightly)",
		);
		expect(Object.keys(pkg.contributes.views)).toEqual([
			"nexus-nightly-ActivityBar",
		]);
		expect(pkg.contributes.views["nexus-nightly-ActivityBar"][0].id).toBe(
			"nexus-nightly.SidebarProvider",
		);
		expect(pkg.contributes.commands[0].command).toBe(
			"nexus-nightly.plusButtonClicked",
		);
		expect(pkg.contributes.keybindings[0].command).toBe(
			"nexus-nightly.addToChat",
		);
		expect(Object.keys(pkg.contributes.configuration.properties)).toEqual([
			"nexus-nightly.enableExtras",
		]);
	});

	it("rewrites when-clauses that start with a rewritten ID, but not mid-string references", () => {
		const [gated, midString] = pkg.contributes.menus["view/title"];
		expect(gated.when).toBe("view == nexus-nightly.SidebarProvider");
		// Documented limitation: `config.nexus.` does not match the `"nexus.`
		// pattern, so it survives unrewritten (matches publish-nightly.mjs).
		expect(midString.when).toBe("config.nexus.enableExtras");
	});

	it("requires a version", () => {
		expect(() => nightlifyPackageJson("{}", undefined)).toThrow(/version/);
	});
});
