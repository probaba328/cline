import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	getNexusCliMigrationNotice,
	markNexusCliMigrationNoticeShown,
	resolveCliNoticeStatePath,
	shouldSuppressNexusCliMigrationNoticeForActiveProvider,
} from "./notice";

const tempDirs: string[] = [];

function createTempDataDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "nexus-cli-notice-"));
	tempDirs.push(dir);
	return dir;
}

describe("migration notice", () => {
	afterEach(() => {
		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns the notice for a fresh data dir", () => {
		const dataDir = createTempDataDir();

		expect(getNexusCliMigrationNotice(dataDir)?.title).toBe("Try NexusPass");
	});

	it("shows when only the old Kanban notice was marked as shown", () => {
		const dataDir = createTempDataDir();
		const noticePath = resolveCliNoticeStatePath(dataDir);
		mkdirSync(dirname(noticePath), { recursive: true, mode: 0o700 });
		writeFileSync(
			noticePath,
			`${JSON.stringify(
				{ shown: { "nexus-cli-tui-default": true } },
				null,
				2,
			)}\n`,
			"utf8",
		);

		expect(getNexusCliMigrationNotice(dataDir)?.id).toBe(
			"nexus-cli-nexus-pass-intro",
		);
	});

	it("does not show after the notice is marked as shown", () => {
		const dataDir = createTempDataDir();

		markNexusCliMigrationNoticeShown(dataDir);

		expect(getNexusCliMigrationNotice(dataDir)).toBeUndefined();
	});

	it("shows after the notice is marked as shown when forced", () => {
		const dataDir = createTempDataDir();

		markNexusCliMigrationNoticeShown(dataDir);

		expect(
			getNexusCliMigrationNotice(dataDir, {
				NEXUS_FORCE_NEXUS_PASS_NOTICE: "1",
			}),
		).toBeDefined();
	});

	it("does not show when disabled through the environment", () => {
		const dataDir = createTempDataDir();

		expect(
			getNexusCliMigrationNotice(dataDir, {
				NEXUS_DISABLE_NEXUS_PASS_NOTICE: "1",
			}),
		).toBeUndefined();
	});

	it("does not show when NexusPass is already the active provider", () => {
		const dataDir = createTempDataDir();

		expect(
			getNexusCliMigrationNotice(
				dataDir,
				{},
				{ activeProviderId: "nexus-pass" },
			),
		).toBeUndefined();
	});

	it("suppresses the active NexusPass provider even when the provider id has surrounding whitespace", () => {
		expect(
			shouldSuppressNexusCliMigrationNoticeForActiveProvider(" nexus-pass "),
		).toBe(true);
	});

	it("does not suppress the active NexusPass provider when forced", () => {
		expect(
			shouldSuppressNexusCliMigrationNoticeForActiveProvider("nexus-pass", {
				NEXUS_FORCE_NEXUS_PASS_NOTICE: "1",
			}),
		).toBe(false);
	});

	it("shows for the active NexusPass provider when forced", () => {
		const dataDir = createTempDataDir();

		expect(
			getNexusCliMigrationNotice(
				dataDir,
				{ NEXUS_FORCE_NEXUS_PASS_NOTICE: "1" },
				{ activeProviderId: "nexus-pass" },
			),
		).toBeDefined();
	});

	it("shows when forced even if disabled through the environment", () => {
		const dataDir = createTempDataDir();

		expect(
			getNexusCliMigrationNotice(dataDir, {
				NEXUS_DISABLE_NEXUS_PASS_NOTICE: "1",
				NEXUS_FORCE_NEXUS_PASS_NOTICE: "1",
			}),
		).toBeDefined();
	});

	it("marks the notice as shown", () => {
		const dataDir = createTempDataDir();

		markNexusCliMigrationNoticeShown(dataDir);

		const rawState = readFileSync(resolveCliNoticeStatePath(dataDir), "utf8");
		expect(rawState).toContain("nexus-cli-nexus-pass-intro");
		expect(getNexusCliMigrationNotice(dataDir)).toBeUndefined();
	});
});
