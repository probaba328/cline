import { test } from "@microsoft/tui-test";
import { NEXUS_BIN } from "./helpers/constants.js";
import { nexusEnv } from "./helpers/env.js";
import { expectVisible } from "./helpers/terminal.js";

// ---------------------------------------------------------------------------
// nexus --version  (root flag)
// ---------------------------------------------------------------------------
test.describe("nexus --version", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["--version"] },
		env: nexusEnv("claude-sonnet-4.6"),
	});

	test("prints the version string", async ({ terminal }) => {
		await expectVisible(terminal, /\d+\.\d+\.\d+/g);
	});
});

// ---------------------------------------------------------------------------
// nexus -V  (short flag)
// ---------------------------------------------------------------------------
test.describe("nexus -V", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["-V"] },
		env: nexusEnv("claude-sonnet-4.6"),
	});

	test("prints the version string with short flag", async ({ terminal }) => {
		await expectVisible(terminal, /\d+\.\d+\.\d+/g);
	});
});

// ---------------------------------------------------------------------------
// nexus version  (subcommand)
// ---------------------------------------------------------------------------
test.describe("nexus version subcommand", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["version"] },
		env: nexusEnv("claude-sonnet-4.6"),
	});

	test("prints 'Nexus CLI version:' message", async ({ terminal }) => {
		await expectVisible(terminal, /\d+\.\d+\.\d+/g);
	});
});
