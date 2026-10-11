import { StringRequest } from "@shared/proto/nexus/common"
import { UiServiceClient } from "@/services/grpc-client"

// NexusPass subscription signup page in the dashboard (requires auth).
const NEXUS_PASS_SUBSCRIBE_PATH = "/onboarding/individual-plan"
const NEXUS_PASS_USAGE_PATH = "/dashboard/subscription"
export const DEFAULT_APP_BASE_URL = "https://app.nexus.bot"

// Module-level so the pending intent survives OnboardingView unmounting: handleAuthCallback
// completes the welcome view (unmounting onboarding) before it pushes the auth-status update
// that sets nexusUser, so this must outlive the component to fire the redirect.
let pendingNexusPassSubscribe = false

export function setPendingNexusPassSubscribe(pending: boolean): void {
	pendingNexusPassSubscribe = pending
}

// Opens the NexusPass subscription page once a pending signup is authenticated (guarded so it fires once).
export function openNexusPassSubscriptionIfPending(appBaseUrl: string | undefined): void {
	if (!pendingNexusPassSubscribe) {
		return
	}
	pendingNexusPassSubscribe = false
	const baseUrl = appBaseUrl || DEFAULT_APP_BASE_URL
	UiServiceClient.openUrl(StringRequest.create({ value: `${baseUrl}${NEXUS_PASS_SUBSCRIBE_PATH}` })).catch((err) =>
		console.error("Failed to open NexusPass subscription page:", err),
	)
}

export function buildNexusPassSubscriptionPageUrl(appBaseUrl: string | undefined): string {
	return new URL(NEXUS_PASS_USAGE_PATH, appBaseUrl || DEFAULT_APP_BASE_URL).toString()
}
