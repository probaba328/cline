import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	resolveNexusDir,
	resolveDbDataDir,
	resolveGlobalTaskSpecsDir,
	resolveTaskSpecsDir,
	resolveTasksDbPath,
	resolveWorkspaceTaskSpecsDir,
} from "./paths";

describe("agenda task storage paths", () => {
	it("places task state in the shared db directory", () => {
		expect(resolveTasksDbPath()).toBe(
			process.env.NEXUS_TASKS_DB_PATH?.trim() ||
				join(resolveDbDataDir(), "tasks.db"),
		);
	});

	it("resolves global and workspace file-backed task roots", () => {
		expect(resolveGlobalTaskSpecsDir()).toBe(join(resolveNexusDir(), "tasks"));
		expect(resolveWorkspaceTaskSpecsDir("/workspace")).toBe(
			join("/workspace", ".nexus", "tasks"),
		);
		expect(
			resolveTaskSpecsDir({ scope: "workspace", workspaceRoot: "/workspace" }),
		).toBe(join("/workspace", ".nexus", "tasks"));
	});
});
