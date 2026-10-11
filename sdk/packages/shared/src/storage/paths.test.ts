import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	AGENT_CONFIG_DIRECTORY_NAME,
	NEXUS_CHAT_WORKSPACE_DIRECTORY_NAME,
	NEXUS_CONNECTOR_SETTINGS_FILE_NAME,
	NEXUS_MCP_SETTINGS_FILE_NAME,
	NEXUS_WORKSPACES_DIRECTORY_NAME,
	getPluginDisplayName,
	HOOKS_CONFIG_DIRECTORY_NAME,
	isChatWorkspacePath,
	RULES_CONFIG_DIRECTORY_NAME,
	resolveAgentsConfigDirPath,
	resolveChatWorkspacePath,
	resolveNexusDataDir,
	resolveConnectorDataDir,
	resolveConnectorSettingsPath,
	resolveDbDataDir,
	resolveGlobalAgentsRulesPath,
	resolveGlobalSettingsPath,
	resolveHooksConfigSearchPaths,
	resolveMcpSettingsPath,
	resolveProviderSettingsPath,
	resolveRulesConfigSearchPaths,
	resolveSessionDataDir,
	resolveTeamDataDir,
	resolveWorkflowsConfigSearchPaths,
} from "./paths";

type EnvSnapshot = {
	NEXUS_DIR: string | undefined;
	NEXUS_DATA_DIR: string | undefined;
	NEXUS_CONNECTOR_DATA_DIR: string | undefined;
	NEXUS_CONNECTOR_SETTINGS_PATH: string | undefined;
	NEXUS_DB_DATA_DIR: string | undefined;
	NEXUS_GLOBAL_SETTINGS_PATH: string | undefined;
	NEXUS_MCP_SETTINGS_PATH: string | undefined;
	NEXUS_PROVIDER_SETTINGS_PATH: string | undefined;
	NEXUS_SESSION_DATA_DIR: string | undefined;
	NEXUS_TEAM_DATA_DIR: string | undefined;
};

function captureEnv(): EnvSnapshot {
	return {
		NEXUS_DIR: process.env.NEXUS_DIR,
		NEXUS_DATA_DIR: process.env.NEXUS_DATA_DIR,
		NEXUS_CONNECTOR_DATA_DIR: process.env.NEXUS_CONNECTOR_DATA_DIR,
		NEXUS_CONNECTOR_SETTINGS_PATH: process.env.NEXUS_CONNECTOR_SETTINGS_PATH,
		NEXUS_DB_DATA_DIR: process.env.NEXUS_DB_DATA_DIR,
		NEXUS_GLOBAL_SETTINGS_PATH: process.env.NEXUS_GLOBAL_SETTINGS_PATH,
		NEXUS_MCP_SETTINGS_PATH: process.env.NEXUS_MCP_SETTINGS_PATH,
		NEXUS_PROVIDER_SETTINGS_PATH: process.env.NEXUS_PROVIDER_SETTINGS_PATH,
		NEXUS_SESSION_DATA_DIR: process.env.NEXUS_SESSION_DATA_DIR,
		NEXUS_TEAM_DATA_DIR: process.env.NEXUS_TEAM_DATA_DIR,
	};
}

function restoreEnv(snapshot: EnvSnapshot): void {
	process.env.NEXUS_DATA_DIR = snapshot.NEXUS_DATA_DIR;
	process.env.NEXUS_CONNECTOR_DATA_DIR = snapshot.NEXUS_CONNECTOR_DATA_DIR;
	process.env.NEXUS_CONNECTOR_SETTINGS_PATH =
		snapshot.NEXUS_CONNECTOR_SETTINGS_PATH;
	process.env.NEXUS_DIR = snapshot.NEXUS_DIR;
	process.env.NEXUS_DB_DATA_DIR = snapshot.NEXUS_DB_DATA_DIR;
	process.env.NEXUS_GLOBAL_SETTINGS_PATH = snapshot.NEXUS_GLOBAL_SETTINGS_PATH;
	process.env.NEXUS_MCP_SETTINGS_PATH = snapshot.NEXUS_MCP_SETTINGS_PATH;
	process.env.NEXUS_PROVIDER_SETTINGS_PATH =
		snapshot.NEXUS_PROVIDER_SETTINGS_PATH;
	process.env.NEXUS_SESSION_DATA_DIR = snapshot.NEXUS_SESSION_DATA_DIR;
	process.env.NEXUS_TEAM_DATA_DIR = snapshot.NEXUS_TEAM_DATA_DIR;
}

describe("storage path resolution", () => {
	let snapshot: EnvSnapshot = captureEnv();

	afterEach(() => {
		restoreEnv(snapshot);
	});

	it("uses NEXUS_DATA_DIR as-is when set", () => {
		snapshot = captureEnv();
		process.env.NEXUS_DATA_DIR = "/tmp/nexus-data";

		expect(resolveNexusDataDir()).toBe("/tmp/nexus-data");
	});

	it("falls back to NEXUS_DATA_DIR/sessions for session storage", () => {
		snapshot = captureEnv();
		delete process.env.NEXUS_SESSION_DATA_DIR;
		process.env.NEXUS_DATA_DIR = "/tmp/nexus-data";

		expect(resolveSessionDataDir()).toBe(join("/tmp/nexus-data", "sessions"));
	});

	it("falls back to NEXUS_DATA_DIR/teams for team storage", () => {
		snapshot = captureEnv();
		delete process.env.NEXUS_TEAM_DATA_DIR;
		process.env.NEXUS_DATA_DIR = "/tmp/nexus-data";

		expect(resolveTeamDataDir()).toBe(join("/tmp/nexus-data", "teams"));
	});

	it("falls back to NEXUS_DATA_DIR/connectors for connector storage", () => {
		snapshot = captureEnv();
		delete process.env.NEXUS_CONNECTOR_DATA_DIR;
		process.env.NEXUS_DATA_DIR = "/tmp/nexus-data";

		expect(resolveConnectorDataDir()).toBe(
			join("/tmp/nexus-data", "connectors"),
		);
	});

	it("falls back to NEXUS_DATA_DIR/connectors/settings.json for connector settings", () => {
		snapshot = captureEnv();
		delete process.env.NEXUS_CONNECTOR_DATA_DIR;
		delete process.env.NEXUS_CONNECTOR_SETTINGS_PATH;
		process.env.NEXUS_DATA_DIR = "/tmp/nexus-data";

		expect(resolveConnectorSettingsPath()).toBe(
			join("/tmp/nexus-data", "connectors", NEXUS_CONNECTOR_SETTINGS_FILE_NAME),
		);
	});

	it("uses NEXUS_CONNECTOR_SETTINGS_PATH as-is when set", () => {
		snapshot = captureEnv();
		process.env.NEXUS_CONNECTOR_SETTINGS_PATH =
			"/tmp/nexus-connectors/custom-settings.json";

		expect(resolveConnectorSettingsPath()).toBe(
			"/tmp/nexus-connectors/custom-settings.json",
		);
	});

	it("falls back to NEXUS_DATA_DIR/db for sqlite storage", () => {
		snapshot = captureEnv();
		delete process.env.NEXUS_DB_DATA_DIR;
		process.env.NEXUS_DATA_DIR = "/tmp/nexus-data";

		expect(resolveDbDataDir()).toBe(join("/tmp/nexus-data", "db"));
	});

	it("falls back to NEXUS_DATA_DIR/settings/providers.json for provider settings", () => {
		snapshot = captureEnv();
		delete process.env.NEXUS_PROVIDER_SETTINGS_PATH;
		process.env.NEXUS_DATA_DIR = "/tmp/nexus-data";

		expect(resolveProviderSettingsPath()).toBe(
			join("/tmp/nexus-data", "settings", "providers.json"),
		);
	});

	it("falls back to NEXUS_DATA_DIR/settings/global-settings.json for global settings", () => {
		snapshot = captureEnv();
		delete process.env.NEXUS_GLOBAL_SETTINGS_PATH;
		process.env.NEXUS_DATA_DIR = "/tmp/nexus-data";

		expect(resolveGlobalSettingsPath()).toBe(
			join("/tmp/nexus-data", "settings", "global-settings.json"),
		);
	});

	it("falls back to NEXUS_DATA_DIR/settings/nexus_mcp_settings.json for MCP settings", () => {
		snapshot = captureEnv();
		delete process.env.NEXUS_MCP_SETTINGS_PATH;
		process.env.NEXUS_DATA_DIR = "/tmp/nexus-data";

		expect(resolveMcpSettingsPath()).toBe(
			join("/tmp/nexus-data", "settings", NEXUS_MCP_SETTINGS_FILE_NAME),
		);
	});

	it("falls back to ~/.nexus/.agents for agent configs", () => {
		snapshot = captureEnv();
		process.env.NEXUS_DIR = "/tmp/home/.nexus";

		expect(resolveAgentsConfigDirPath()).toBe(
			join("/tmp/home", ".nexus", AGENT_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves global hooks from ~/.nexus", () => {
		snapshot = captureEnv();
		process.env.NEXUS_DIR = "/tmp/home/.nexus";
		process.env.NEXUS_DATA_DIR = "/tmp/home/.nexus/data";

		expect(resolveHooksConfigSearchPaths()).toEqual(
			expect.arrayContaining([
				join("/tmp/home", ".nexus", HOOKS_CONFIG_DIRECTORY_NAME),
			]),
		);
		expect(resolveHooksConfigSearchPaths()).not.toContain(
			join("/tmp/home", ".nexus", "data", HOOKS_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves global rules from ~/.nexus", () => {
		snapshot = captureEnv();
		process.env.NEXUS_DIR = "/tmp/home/.nexus";
		process.env.NEXUS_DATA_DIR = "/tmp/home/.nexus/data";

		expect(resolveRulesConfigSearchPaths()).toEqual(
			expect.arrayContaining([
				resolveGlobalAgentsRulesPath(),
				join("/tmp/home", ".nexus", RULES_CONFIG_DIRECTORY_NAME),
			]),
		);
		expect(resolveRulesConfigSearchPaths()).not.toContain(
			join("/tmp/home", ".nexus", "data", RULES_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves legacy and new workflow paths, with .nexus paths later for duplicate-name precedence", () => {
		snapshot = captureEnv();
		process.env.NEXUS_DIR = "/tmp/home/.nexus";
		const workspacePath = "/repo/demo";

		const paths = resolveWorkflowsConfigSearchPaths(workspacePath);

		expect(paths).toEqual([
			join(workspacePath, ".nexusrules", "workflows"),
			expect.stringContaining(join("Documents", "Nexus", "Workflows")),
			join("/tmp/home", ".nexus", "workflows"),
			join(workspacePath, ".nexus", "workflows"),
		]);
	});
});

describe("chat workspace paths", () => {
	let snapshot: EnvSnapshot = captureEnv();

	afterEach(() => {
		restoreEnv(snapshot);
	});

	it("exports the canonical path segments", () => {
		expect(NEXUS_WORKSPACES_DIRECTORY_NAME).toBe("workspaces");
		expect(NEXUS_CHAT_WORKSPACE_DIRECTORY_NAME).toBe("chat");
	});

	it("resolves the shared chat workspace under the nexus data dir", () => {
		snapshot = captureEnv();
		delete process.env.NEXUS_DATA_DIR;
		process.env.NEXUS_DIR = "/tmp/home/.nexus";

		expect(resolveChatWorkspacePath()).toBe(
			join("/tmp/home/.nexus", "data", "workspaces", "chat"),
		);
	});

	it("honors the NEXUS_DATA_DIR override", () => {
		snapshot = captureEnv();
		process.env.NEXUS_DATA_DIR = "/tmp/nexus-data";

		expect(resolveChatWorkspacePath()).toBe(
			join("/tmp/nexus-data", "workspaces", "chat"),
		);
	});

	it.each([
		"/home/user/.nexus/data/workspaces/chat",
		"//home//user//.nexus//data//workspaces//chat//",
		"C:\\Users\\dev\\.nexus\\data\\workspaces\\chat\\",
		"\\\\server\\share\\.nexus\\data\\workspaces\\chat",
	])("recognizes chat workspace root %s", (path) => {
		expect(isChatWorkspacePath(path)).toBe(true);
	});

	it.each([
		".nexus/data/workspaces/chat",
		"/tmp/chat",
		"/tmp/nexus/sessions/session-a1b2c3-temp/project",
		"/home/user/nexus/data/workspaces/chat",
		"/home/user/.nexus/workspaces/chat",
		"/home/user/.nexus/data/other/chat",
		"/home/user/.nexus/data/workspaces/Chat",
		"/home/user/.nexus/data/workspaces/chat/my-app",
		"/home/user/.nexus/data/workspaces",
	])("rejects non-chat workspace path %s", (path) => {
		expect(isChatWorkspacePath(path)).toBe(false);
	});
});

describe("getPluginDisplayName", () => {
	const tempRoots: string[] = [];

	function createTempRoot(): string {
		const root = mkdtempSync(join(tmpdir(), "nexus-plugin-name-"));
		tempRoots.push(root);
		return root;
	}

	afterEach(() => {
		for (const root of tempRoots.splice(0)) {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it("uses the package name for package-backed installed plugin entries", () => {
		const root = createTempRoot();
		const packageDir = join(
			root,
			"_installed",
			"local",
			"agents-squad-057fda0dd505",
			"package",
		);
		mkdirSync(packageDir, { recursive: true });
		writeFileSync(
			join(packageDir, "package.json"),
			JSON.stringify({ name: "nexus-agents-squad-plugin" }),
		);
		const entryPath = join(packageDir, "index.ts");
		writeFileSync(entryPath, "export default {};");

		expect(getPluginDisplayName(entryPath, root)).toBe(
			"nexus-agents-squad-plugin",
		);
	});

	it("finds the package name in an ancestor directory within the search root", () => {
		const root = createTempRoot();
		const packageDir = join(root, "my-plugin");
		const srcDir = join(packageDir, "src");
		mkdirSync(srcDir, { recursive: true });
		writeFileSync(
			join(packageDir, "package.json"),
			JSON.stringify({ name: "my-plugin" }),
		);
		const entryPath = join(srcDir, "index.ts");
		writeFileSync(entryPath, "export default {};");

		expect(getPluginDisplayName(entryPath, root)).toBe("my-plugin");
	});

	it("falls back to the file basename when package.json has no usable name", () => {
		const root = createTempRoot();
		const packageDir = join(root, "unnamed", "package");
		mkdirSync(packageDir, { recursive: true });
		writeFileSync(join(packageDir, "package.json"), JSON.stringify({}));
		const entryPath = join(packageDir, "index.ts");
		writeFileSync(entryPath, "export default {};");

		expect(getPluginDisplayName(entryPath, root)).toBe("index");
	});

	it("falls back to the file basename for bare plugin modules", () => {
		const root = createTempRoot();
		const entryPath = join(root, "x-poster.js");
		writeFileSync(entryPath, "module.exports = {};");

		expect(getPluginDisplayName(entryPath, root)).toBe("x-poster");
	});

	it("does not read package.json files above the search root", () => {
		const outer = createTempRoot();
		writeFileSync(
			join(outer, "package.json"),
			JSON.stringify({ name: "outer-package" }),
		);
		const root = join(outer, "plugins");
		mkdirSync(root, { recursive: true });
		const entryPath = join(root, "index.ts");
		writeFileSync(entryPath, "export default {};");

		expect(getPluginDisplayName(entryPath, root)).toBe("index");
	});
});
