import { test } from "@microsoft/tui-test";
import { NEXUS_BIN } from "./helpers/constants.js";
import { nexusEnv } from "./helpers/env.js";
import { expectVisible } from "./helpers/terminal.js";

const HELP_TERMINAL = { columns: 120, rows: 50 };

// ===========================================================================
// nexus --help  (root help)
// ===========================================================================
test.describe("nexus --help", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["--help"] },
		env: nexusEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows Usage line and lists all subcommands", async ({ terminal }) => {
		await expectVisible(terminal, [
			"Usage:",
			"history|h",
			"auth [options]",
			"version",
			"update [options]",
			"hub ",
		]);
	});

	test("shows all root-level option flags", async ({ terminal }) => {
		await expectVisible(terminal, [
			"--plan",
			"--timeout",
			"--model",
			"--verbose",
			"--cwd",
			"--config",
			"--thinking",
			"--retries",
			"--json",
			"--acp",
			"--update",
		]);
	});
});

// ===========================================================================
// nexus -h  (short help flag)
// ===========================================================================
test.describe("nexus -h", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["-h"] },
		env: nexusEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows Usage line with short flag", async ({ terminal }) => {
		await expectVisible(terminal, "Usage:");
	});
});

// ===========================================================================
// nexus history --help
// ===========================================================================
test.describe("nexus history --help", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["history", "--help"] },
		env: nexusEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows history usage and all flags", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--limit", "--page", "--config"]);
	});
});

// ===========================================================================
// nexus h --help  (history alias)
// ===========================================================================
test.describe("nexus h --help (history alias)", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["h", "--help"] },
		env: nexusEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows history usage and flags via alias", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--limit"]);
	});
});

// ===========================================================================
// nexus config --help
// ===========================================================================
test.describe("nexus config --help", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["config", "--help"] },
		env: nexusEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows config usage and --config flag", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--config"]);
	});
});

// ===========================================================================
// nexus auth --help
// ===========================================================================
test.describe("nexus auth --help", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["auth", "--help"] },
		env: nexusEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows auth usage and all flags", async ({ terminal }) => {
		await expectVisible(terminal, [
			"Usage:",
			"--provider",
			"--apikey",
			"--modelid",
			"--baseurl",
			"--config",
		]);
	});
});

// ===========================================================================
// nexus version --help
// ===========================================================================
test.describe("nexus version --help", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["version", "--help"] },
		env: nexusEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows version command usage", async ({ terminal }) => {
		await expectVisible(terminal, "Usage:");
	});
});

// ===========================================================================
// nexus update --help
// ===========================================================================
test.describe("nexus update --help", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["update", "--help"] },
		env: nexusEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows update usage and --verbose flag", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--verbose"]);
	});
});

// ===========================================================================
// nexus doctor --help
// ===========================================================================
test.describe("nexus doctor --help", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["doctor", "--help"] },
		env: nexusEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows doctor usage and lists fix and log subcommands", async ({
		terminal,
	}) => {
		await expectVisible(terminal, ["Usage:", "fix", "log"]);
	});
});
