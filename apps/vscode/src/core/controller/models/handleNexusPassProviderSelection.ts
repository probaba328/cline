import type { ApiConfiguration } from "@shared/api"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../index"

export const NEXUS_PASS_PROVIDER_ID = "nexus-pass"

/**
 * NexusPass always uses the user's personal Nexus account balance.
 *
 * The account switch is a network round-trip (plus a possible token refresh),
 * so it runs fire-and-forget: callers must not block the config update — or
 * the state post that re-renders the settings UI — on it. Auth state changes
 * propagate to the webview separately once the switch completes.
 *
 * This is intentionally best-effort: selecting the provider should still be
 * saved even if the account switch fails.
 */
export function clearOrganizationForNexusPassProviderSelection(
	controller: Controller,
	apiConfiguration: Pick<ApiConfiguration, "planModeApiProvider" | "actModeApiProvider">,
): void {
	if (
		apiConfiguration.planModeApiProvider !== NEXUS_PASS_PROVIDER_ID &&
		apiConfiguration.actModeApiProvider !== NEXUS_PASS_PROVIDER_ID
	) {
		return
	}

	controller.accountService.switchAccount(undefined).catch((error) => {
		Logger.debug("Failed to switch NexusPass to personal account", { error })
	})
}
