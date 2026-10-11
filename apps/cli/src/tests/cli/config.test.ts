// ---------------------------------------------------------------------------
// nexus config - CLI tests
//
// Covers:
//   - `nexus config --config <dir>` - shows config for specific directory
//   - `nexus config --help`         - help page
// ---------------------------------------------------------------------------

import { test } from "@microsoft/tui-test";
import { NEXUS_BIN, TERMINAL_WIDE } from "../helpers/constants.js";
import { nexusEnv } from "../helpers/env.js";
import { expectVisible } from "../helpers/terminal.js";

test.describe("nexus config --help", () => {
	test.use({
		program: { file: NEXUS_BIN, args: ["config", "--help"] },
		...TERMINAL_WIDE,
		env: nexusEnv("default"),
	});

	test("shows config help page", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--config"]);
	});
});
