import { getWorkspaceBasename } from "@core/workspace"
import type { ToggleNexusRuleRequest } from "@shared/proto/nexus/file"
import { RuleScope, ToggleNexusRules } from "@shared/proto/nexus/file"
import { telemetryService } from "@/services/telemetry"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../index"

/**
 * Toggles a Nexus rule (enable or disable)
 * @param controller The controller instance
 * @param request The toggle request
 * @returns The updated Nexus rule toggles
 */
export async function toggleNexusRule(controller: Controller, request: ToggleNexusRuleRequest): Promise<ToggleNexusRules> {
	const { scope, rulePath, enabled } = request

	if (!rulePath || typeof enabled !== "boolean" || scope === undefined) {
		Logger.error("toggleNexusRule: Missing or invalid parameters", {
			rulePath,
			scope,
			enabled: typeof enabled === "boolean" ? enabled : `Invalid: ${typeof enabled}`,
		})
		throw new Error("Missing or invalid parameters for toggleNexusRule")
	}

	// Handle the three different scopes
	switch (scope) {
		case RuleScope.GLOBAL: {
			const toggles = controller.stateManager.getGlobalSettingsKey("globalNexusRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setGlobalState("globalNexusRulesToggles", toggles)
			break
		}
		case RuleScope.LOCAL: {
			const toggles = controller.stateManager.getWorkspaceStateKey("localNexusRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setWorkspaceState("localNexusRulesToggles", toggles)
			break
		}
		case RuleScope.REMOTE: {
			const toggles = controller.stateManager.getGlobalStateKey("remoteRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setGlobalState("remoteRulesToggles", toggles)
			break
		}
		default:
			throw new Error(`Invalid scope: ${scope}`)
	}

	// Track rule toggle telemetry with current task context
	if (controller.task?.ulid) {
		// Extract just the filename for privacy (no full paths)
		const ruleFileName = getWorkspaceBasename(rulePath, "Controller.toggleNexusRule")
		const isGlobal = scope === RuleScope.GLOBAL
		telemetryService.captureNexusRuleToggled(controller.task.ulid, ruleFileName, enabled, isGlobal)
	}

	// Get the current state to return in the response
	const globalToggles = controller.stateManager.getGlobalSettingsKey("globalNexusRulesToggles")
	const localToggles = controller.stateManager.getWorkspaceStateKey("localNexusRulesToggles")
	const remoteToggles = controller.stateManager.getGlobalStateKey("remoteRulesToggles")

	return ToggleNexusRules.create({
		globalNexusRulesToggles: { toggles: globalToggles },
		localNexusRulesToggles: { toggles: localToggles },
		remoteRulesToggles: { toggles: remoteToggles },
	})
}
