import os from "os"
import * as path from "path"

const SKILL_DIRECTORY_NAMES = {
	clineruleSkillsDir: ".nexusrules/skills",
	nexusSkillsDir: ".nexus/skills",
	claudeSkillsDir: ".claude/skills",
	agentsSkillsDir: ".agents/skills",
} as const

export type SkillsScanDirectory = {
	path: string
	source: "project" | "global"
}

function getNexusHomePath(): string {
	return path.join(os.homedir(), ".nexus")
}

function getNexusSkillsDirectoryPath(): string {
	return path.join(getNexusHomePath(), "skills")
}

function getAgentSkillsDirectoryPath(): string {
	return path.join(os.homedir(), ".agents", "skills")
}

/**
 * Returns the list of skills directories to scan without creating them.
 * Order is project directories first, then global directories.
 */
export function getSkillsDirectoriesForScan(cwd: string): SkillsScanDirectory[] {
	return [
		{ path: path.join(cwd, SKILL_DIRECTORY_NAMES.clineruleSkillsDir), source: "project" },
		{ path: path.join(cwd, SKILL_DIRECTORY_NAMES.nexusSkillsDir), source: "project" },
		{ path: path.join(cwd, SKILL_DIRECTORY_NAMES.claudeSkillsDir), source: "project" },
		{ path: path.join(cwd, SKILL_DIRECTORY_NAMES.agentsSkillsDir), source: "project" },
		{ path: getNexusSkillsDirectoryPath(), source: "global" },
		{ path: getAgentSkillsDirectoryPath(), source: "global" },
	]
}
