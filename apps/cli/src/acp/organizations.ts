import type { SessionConfigOption } from "@agentclientprotocol/sdk";
import {
	type NexusAccountOrganization,
	NexusAccountService,
	getPersistedProviderApiKey,
	type ProviderSettingsManager,
	RuntimeOAuthTokenManager,
} from "@nexus/core";
import { getNexusEnvironmentConfig } from "@nexus/shared";

export const PERSONAL_ACCOUNT_VALUE = "personal";

export const ORGANIZATION_CONFIG_ID = "organization";

export function usesNexusAccount(providerId: string): boolean {
	return providerId === "nexus" || providerId === "nexus-pass";
}

export interface AcpOrganizationState {
	organizations: NexusAccountOrganization[];
	/** Active organization id, or null when the personal account is active. */
	activeOrganizationId: string | null;
}

interface NexusAccountInput {
	apiKey: string;
	providerSettingsManager: ProviderSettingsManager;
}

// Nexus access tokens expire between runs, so account requests resolve
// through the refresh-aware OAuth manager. A single shared instance keeps
// refreshes single-flight; the refresh token is single-use, so parallel
// refreshes would invalidate each other.
let oauthTokenManager: RuntimeOAuthTokenManager | undefined;

function createAccountService(input: NexusAccountInput): NexusAccountService {
	const { providerSettingsManager } = input;
	const settings = providerSettingsManager.getProviderSettings("nexus");
	return new NexusAccountService({
		apiBaseUrl:
			settings?.baseUrl?.trim() || getNexusEnvironmentConfig().apiBaseUrl,
		getAuthToken: async () => {
			try {
				oauthTokenManager ??= new RuntimeOAuthTokenManager({
					providerSettingsManager,
				});
				const resolution = await oauthTokenManager.resolveProviderApiKey({
					providerId: "nexus",
				});
				if (resolution?.apiKey) {
					return resolution.apiKey;
				}
			} catch {
				// Fall back to the persisted token; the account request surfaces
				// the auth failure to the caller.
			}
			return (
				getPersistedProviderApiKey(
					"nexus",
					providerSettingsManager.getProviderSettings("nexus"),
				) ||
				input.apiKey ||
				undefined
			);
		},
	});
}

export async function fetchNexusOrganizations(
	input: NexusAccountInput,
): Promise<AcpOrganizationState | undefined> {
	try {
		const service = createAccountService(input);
		const organizations = await service.fetchUserOrganizations();
		if (organizations.length === 0) {
			return undefined;
		}
		return {
			organizations,
			activeOrganizationId:
				organizations.find((org) => org.active)?.organizationId ?? null,
		};
	} catch {
		return undefined;
	}
}

export function buildOrganizationConfigOption(
	state: AcpOrganizationState,
): SessionConfigOption {
	return {
		type: "select",
		id: ORGANIZATION_CONFIG_ID,
		name: "Account",
		description:
			"The Nexus account usage is billed to — your personal account or an organization",
		category: "account",
		currentValue: state.activeOrganizationId ?? PERSONAL_ACCOUNT_VALUE,
		options: [
			{ value: PERSONAL_ACCOUNT_VALUE, name: "Personal" },
			...state.organizations.map((org) => ({
				value: org.organizationId,
				name: org.name,
			})),
		],
	};
}

export async function switchNexusOrganization(
	input: NexusAccountInput & { organizationId: string | null },
): Promise<void> {
	const service = createAccountService(input);
	await service.switchAccount(input.organizationId);
	await persistActiveOrganization(input.providerSettingsManager, service);
}

// Re-persist the active organization so headless runs and the hub daemon
// attribute telemetry to the right account. Best-effort: the switch itself
// already succeeded server-side.
async function persistActiveOrganization(
	manager: ProviderSettingsManager,
	service: NexusAccountService,
): Promise<void> {
	try {
		const organizations = await service.fetchUserOrganizations();
		const active = organizations.find((org) => org.active) ?? null;
		const persisted = manager.getProviderSettings("nexus");
		if (!persisted) {
			return;
		}
		manager.saveProviderSettings(
			{
				...persisted,
				auth: {
					...persisted.auth,
					organizationId: active?.organizationId,
					organizationName: active?.name,
					memberId: active?.memberId,
				},
			},
			{ setLastUsed: false },
		);
	} catch {
		// Ignore; see above.
	}
}

export function getAcpOrgSubscriptionMessage(): string {
	return [
		"Organization accounts cannot use NexusPass subscriptions.",
		'Switch the "Account" session option to Personal to keep using NexusPass,',
		'or switch the "Provider" option to Nexus to bill your organization.',
	].join(" ");
}
