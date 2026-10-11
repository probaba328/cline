import { synchronizeRuleToggles } from "@core/context/instructions/user-instructions/rule-helpers"
import { ensureRulesDirectoryExists, GlobalFileNames } from "@core/storage/disk"
import { NexusRulesToggles } from "@shared/nexus-rules"
import path from "path"
import { Controller } from "@/core/controller"

export async function refreshNexusRulesToggles(
	controller: Controller,
	workingDirectory: string,
): Promise<{
	globalToggles: NexusRulesToggles
	localToggles: NexusRulesToggles
}> {
	// Global toggles
	const globalNexusRulesToggles = controller.stateManager.getGlobalSettingsKey("globalNexusRulesToggles")
	const globalNexusRulesFilePath = await ensureRulesDirectoryExists()
	const updatedGlobalToggles = await synchronizeRuleToggles(globalNexusRulesFilePath, globalNexusRulesToggles)
	controller.stateManager.setGlobalState("globalNexusRulesToggles", updatedGlobalToggles)

	// Local toggles
	const localNexusRulesToggles = controller.stateManager.getWorkspaceStateKey("localNexusRulesToggles")
	const localNexusRulesFilePath = path.resolve(workingDirectory, GlobalFileNames.nexusRules)
	const updatedLocalToggles = await synchronizeRuleToggles(localNexusRulesFilePath, localNexusRulesToggles, "", [
		[".nexusrules", "workflows"],
		[".nexusrules", "hooks"],
		[".nexusrules", "skills"],
	])
	controller.stateManager.setWorkspaceState("localNexusRulesToggles", updatedLocalToggles)

	return {
		globalToggles: updatedGlobalToggles,
		localToggles: updatedLocalToggles,
	}
}
