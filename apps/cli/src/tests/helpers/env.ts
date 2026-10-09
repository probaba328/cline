// ---------------------------------------------------------------------------
// Environment helpers for test setup.
//
// Usage:
//   test.use({ env: nexusEnv("default") });
//   test.use({ env: nexusEnv("claude-sonnet-4.6") });
//   test.use({ env: nexusEnv("/absolute/path/to/config") });
// ---------------------------------------------------------------------------

import { cpSync, mkdirSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const TEST_SUITE_ROOT = new URL("../", import.meta.url).pathname;

let envCounter = 0;

function createIsolatedNexusDir(sourceDir: string): string {
	const tempRoot = mkdtempSync(path.join(os.tmpdir(), "nexus-tui-test-"));
	const targetDir = path.join(tempRoot, "nexus");
	cpSync(sourceDir, targetDir, {
		recursive: true,
		errorOnExist: false,
		force: true,
	});
	mkdirSync(path.join(targetDir, "home"), { recursive: true });
	return targetDir;
}

function nextHubPort(): string {
	envCounter += 1;
	const basePort = 30_000 + (process.pid % 10_000);
	return String(basePort + (envCounter % 10_000));
}

/**
 * Build the process environment for a nexus test.
 *
 * @param configDir - Named config under `configs/`, or an absolute path.
 * @param extra     - Additional env vars to merge in (override defaults).
 */
export function nexusEnv(
	configDir: string,
	extra: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
	const nexusPath = path.isAbsolute(configDir)
		? configDir
		: path.join(TEST_SUITE_ROOT, "configs", configDir);
	const isolatedNexusPath = createIsolatedNexusDir(nexusPath);
	const dataDir = path.join(isolatedNexusPath, "data");

	// Determine effective VCR mode: extra overrides > parent env > default "playback"
	const effectiveVcrMode =
		extra.NEXUS_VCR ?? process.env.NEXUS_VCR ?? "playback";

	// During recording, authenticated configs read real OAuth credentials from
	// ~/.nexus/data/settings/providers.json while keeping all other settings
	// (model, provider, global state) from the mock config directory.
	const isRecording = effectiveVcrMode === "record";
	const isAuthenticated = configDir !== "unauthenticated";
	const realProvidersFile =
		isRecording && isAuthenticated
			? path.join(os.homedir(), ".nexus", "data", "settings", "providers.json")
			: undefined;

	// Remove CI so terminal renderers treat the spawned process as interactive.
	// Remove VITEST so the spawned CLI binary doesn't skip initVcr().
	// cli/src/index.ts guards `initVcr` behind `process.env.VITEST !== "true"`,
	// so if the parent vitest process's VITEST=true leaks into the child, VCR
	// recording/playback is silently skipped.
	const { CI: _ci, VITEST: _vitest, ...cleanEnv } = process.env;
	if (!isAuthenticated) {
		delete cleanEnv.NEXUS_API_KEY;
	}

	// Only enable VCR when a cassette path is provided (via extra or parent env),
	// otherwise tests without cassettes would trigger a spurious
	// "[VCR] No NEXUS_VCR_CASSETTE" warning on every run.
	const hasCassette = !!(
		extra.NEXUS_VCR_CASSETTE ?? process.env.NEXUS_VCR_CASSETTE
	);
	const vcrDefaults = hasCassette
		? { NEXUS_VCR: "playback", NEXUS_VCR_FILTER: "" }
		: {};

	// the order of these env vars matter; later ones override earlier ones
	return {
		...vcrDefaults,
		...cleanEnv,
		...(realProvidersFile
			? { NEXUS_PROVIDER_SETTINGS_PATH: realProvidersFile }
			: {}),
		NEXUS_TELEMETRY_DISABLED: "1",
		HOME: path.join(isolatedNexusPath, "home"),
		NEXUS_DIR: isolatedNexusPath,
		NEXUS_DATA_DIR: dataDir,
		NEXUS_DB_DATA_DIR: path.join(dataDir, "db"),
		NEXUS_GLOBAL_SETTINGS_PATH: path.join(
			dataDir,
			"settings",
			"global-settings.json",
		),
		NEXUS_HOOKS_LOG_PATH: path.join(dataDir, "logs", "hooks.jsonl"),
		NEXUS_HUB_DISCOVERY_PATH: path.join(
			dataDir,
			"locks",
			"hub",
			"discovery.json",
		),
		NEXUS_HUB_PORT: nextHubPort(),
		NEXUS_MCP_SETTINGS_PATH: path.join(
			dataDir,
			"settings",
			"nexus_mcp_settings.json",
		),
		...(realProvidersFile
			? {}
			: {
					NEXUS_PROVIDER_SETTINGS_PATH: path.join(
						dataDir,
						"settings",
						"providers.json",
					),
				}),
		NEXUS_SESSION_DATA_DIR: path.join(dataDir, "sessions"),
		NEXUS_TEAM_DATA_DIR: path.join(dataDir, "teams"),
		NEXUS_DISABLE_NEXUS_PASS_NOTICE: "1",
		NO_UPDATE_NOTIFIER: "1",
		NEXUS_NO_AUTO_UPDATE: "1",
		...extra,
	};
}
