import {
	type NexusAccountBalance,
	type NexusAccountOrganization,
	type NexusAccountOrganizationBalance,
	NexusAccountService,
	type NexusAccountUser,
	type NexusSubscriptionPlan,
	formatProviderOAuthApiKey,
	getPersistedProviderApiKey,
	getProviderOAuthCredentialsFromSettings,
	getValidNexusCredentials,
	type ProviderSettings,
	ProviderSettingsManager,
	saveLocalProviderOAuthCredentials,
	type UserCurrentPlan,
} from "@nexus/core";
import { getNexusEnvironmentConfig } from "@nexus/shared";
import { formatCreditBalance, normalizeCreditBalance } from "../utils/output";
import { identifyTelemetryAccount } from "../utils/telemetry";
import type { Config } from "../utils/types";

export const NEXUS_CREDITS_DASHBOARD_URL =
	"https://app.nexus.bot/dashboard/account?tab=credits";

type NexusAccountConfig = Pick<Config, "apiKey" | "logger" | "providerId">;

const NEXUS_PASS_PROVIDER_ID = "nexus-pass";

export interface NexusAccountSnapshot {
	user: NexusAccountUser;
	balance: NexusAccountBalance;
	organizationBalance: NexusAccountOrganizationBalance | null;
	organizations: NexusAccountOrganization[];
	activeOrganization: NexusAccountOrganization | null;
	displayedBalance: number;
}

export function formatNexusCredits(value: number): string {
	return formatCreditBalance(normalizeCreditBalance(value));
}

// FIXME: These message checks are temporary until structured error types are
// passed through to the CLI instead of plain error strings.
export function isNexusAccountAuthErrorMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized === "no nexus account auth token found" ||
		normalized.includes("requires re-authentication")
	);
}

export function isNexusAccountCreditsErrorMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	// The Nexus API's 402 response carries `code: "insufficient_credits"` and
	// the message "Not enough credits available". Depending on how much of the
	// payload survives error extraction, the CLI may see the raw JSON blob or
	// just the human-readable message, so match both. The
	// "insufficient balance" pair is an older backend phrasing kept for safety.
	return (
		normalized.includes("insufficient_credits") ||
		normalized.includes("not enough credits") ||
		(normalized.includes("insufficient balance") &&
			normalized.includes("nexus credits balance"))
	);
}

function resolveAccountApiBaseUrl(input: {
	nexusApiBaseUrl?: string;
	nexusProviderSettings?: ProviderSettings;
}): string {
	const settingsBaseUrl = input.nexusProviderSettings?.baseUrl?.trim();
	if (settingsBaseUrl) {
		return settingsBaseUrl;
	}
	const configuredBaseUrl = input.nexusApiBaseUrl?.trim();
	if (configuredBaseUrl) {
		return configuredBaseUrl;
	}
	return getNexusEnvironmentConfig().apiBaseUrl;
}

function resolveNexusAccountAuthToken(input: {
	config: NexusAccountConfig;
	nexusProviderSettings?: ProviderSettings;
}): string | undefined {
	const configApiKey =
		input.config.providerId === "nexus" ? input.config.apiKey.trim() : "";
	return (
		getPersistedProviderApiKey("nexus", input.nexusProviderSettings) ||
		configApiKey ||
		undefined
	);
}

async function resolveValidNexusAccountAuthToken(input: {
	config: NexusAccountConfig;
	nexusProviderSettings?: ProviderSettings;
	manager: ProviderSettingsManager;
	apiBaseUrl: string;
}): Promise<string | undefined> {
	const settings = input.nexusProviderSettings;
	const credentials = settings
		? getProviderOAuthCredentialsFromSettings("nexus", settings)
		: null;
	if (settings && credentials) {
		const nextCredentials = await getValidNexusCredentials(credentials, {
			apiBaseUrl: input.apiBaseUrl,
		});
		if (!nextCredentials) {
			throw new Error(
				"Nexus account requires re-authentication. Run nexus auth nexus.",
			);
		}
		const nextAccessToken = formatProviderOAuthApiKey("nexus", nextCredentials);
		if (nextCredentials !== credentials) {
			saveLocalProviderOAuthCredentials(
				input.manager,
				"nexus",
				settings,
				nextCredentials,
				{ setLastUsed: false },
			);
		}
		return nextAccessToken;
	}
	return resolveNexusAccountAuthToken({
		config: input.config,
		nexusProviderSettings: settings,
	});
}

export async function createNexusAccountService(input: {
	config: NexusAccountConfig;
	nexusApiBaseUrl?: string;
	nexusProviderSettings?: ProviderSettings;
	providerSettingsManager?: ProviderSettingsManager;
}): Promise<NexusAccountService | undefined> {
	const manager =
		input.providerSettingsManager ?? new ProviderSettingsManager();
	const settings =
		manager.getProviderSettings("nexus") ?? input.nexusProviderSettings;
	const apiBaseUrl = resolveAccountApiBaseUrl({
		nexusApiBaseUrl: input.nexusApiBaseUrl,
		nexusProviderSettings: settings,
	});
	const authToken = await resolveValidNexusAccountAuthToken({
		config: input.config,
		nexusProviderSettings: settings,
		manager,
		apiBaseUrl,
	});
	if (!authToken) {
		return undefined;
	}
	return new NexusAccountService({
		apiBaseUrl,
		getAuthToken: async () => authToken,
	});
}

/**
 * Persist the active organization so headless runs and the hub daemon can
 * attach it to telemetry identity. Personal account clears stale org fields.
 */
function persistNexusOrganizationContext(
	activeOrganization: NexusAccountOrganization | null,
	userId: string,
): void {
	try {
		const manager = new ProviderSettingsManager();
		const persisted = manager.getProviderSettings("nexus");
		if (!persisted) {
			return;
		}
		manager.saveProviderSettings(
			{
				...persisted,
				auth: {
					...persisted.auth,
					accountId: persisted.auth?.accountId ?? userId,
					organizationId: activeOrganization?.organizationId,
					organizationName: activeOrganization?.name,
					memberId: activeOrganization?.memberId,
				},
			},
			{ setLastUsed: false },
		);
	} catch {
		// Best-effort only.
	}
}

export async function loadNexusAccountSnapshot(input: {
	config: NexusAccountConfig;
	nexusApiBaseUrl?: string;
	nexusProviderSettings?: ProviderSettings;
}): Promise<NexusAccountSnapshot> {
	const service = await createNexusAccountService(input);
	if (!service) {
		throw new Error("No Nexus account auth token found");
	}

	const user = await service.fetchMe();
	const organizations = user.organizations ?? [];
	const activeOrganization =
		organizations.find((organization) => organization.active) ?? null;
	const [balance, organizationBalance] = await Promise.all([
		service.fetchBalance(user.id),
		activeOrganization
			? service.fetchOrganizationBalance(activeOrganization.organizationId)
			: Promise.resolve(null),
	]);
	const displayedBalance = activeOrganization
		? (organizationBalance?.balance ?? balance.balance)
		: balance.balance;
	const accountContext = {
		id: user.id,
		email: user.email,
		provider: "nexus",
		organizationId: activeOrganization?.organizationId,
		organizationName: activeOrganization?.name,
		memberId: activeOrganization?.memberId,
	};
	identifyTelemetryAccount(accountContext, input.config.logger);
	persistNexusOrganizationContext(activeOrganization, user.id);

	return {
		user,
		balance,
		organizationBalance,
		organizations,
		activeOrganization,
		displayedBalance,
	};
}

export async function switchNexusAccount(input: {
	config: NexusAccountConfig;
	organizationId?: string | null;
	nexusApiBaseUrl?: string;
	nexusProviderSettings?: ProviderSettings;
}): Promise<void> {
	const service = await createNexusAccountService(input);
	if (!service) {
		throw new Error("No Nexus account auth token found");
	}
	await service.switchAccount(input.organizationId);
}

export async function loadIndividualSubscriptionPlans(input: {
	config: NexusAccountConfig;
	nexusApiBaseUrl?: string;
	nexusProviderSettings?: ProviderSettings;
}): Promise<NexusSubscriptionPlan[]> {
	const service = await createNexusAccountService(input);
	if (!service) {
		throw new Error("No Nexus account auth token found");
	}
	return service.fetchAvailableSubscriptionPlans({ type: "individual" });
}

export async function loadCurrentUserPlan(input: {
	config: NexusAccountConfig;
	nexusApiBaseUrl?: string;
	nexusProviderSettings?: ProviderSettings;
}): Promise<UserCurrentPlan | undefined> {
	const service = await createNexusAccountService(input);
	if (!service) {
		throw new Error("No Nexus account auth token found");
	}
	return service.fetchCurrentUserPlan();
}

export async function loadCurrentUserPlanFromProviderSettings(input: {
	providerSettingsManager: ProviderSettingsManager;
	nexusApiBaseUrl?: string;
}): Promise<UserCurrentPlan | undefined> {
	const service = await createNexusAccountService({
		config: { apiKey: "", logger: undefined, providerId: "nexus" },
		nexusApiBaseUrl: input.nexusApiBaseUrl,
		providerSettingsManager: input.providerSettingsManager,
	});
	if (!service) {
		throw new Error("No Nexus account auth token found");
	}
	return service.fetchCurrentUserPlan();
}

export async function loadIndividualSubscriptionPlansFromProviderSettings(input: {
	providerSettingsManager: ProviderSettingsManager;
	nexusApiBaseUrl?: string;
}): Promise<NexusSubscriptionPlan[]> {
	const service = await createNexusAccountService({
		config: { apiKey: "", logger: undefined, providerId: "nexus" },
		nexusApiBaseUrl: input.nexusApiBaseUrl,
		providerSettingsManager: input.providerSettingsManager,
	});
	if (!service) {
		throw new Error("No Nexus account auth token found");
	}
	return service.fetchAvailableSubscriptionPlans({ type: "individual" });
}

async function onChangeToNexusPass(config: NexusAccountConfig) {
	try {
		await switchNexusAccount({
			config: config,
			organizationId: null,
		});
	} catch (error) {
		config.logger?.debug("Failed to switch NexusPass to personal account", {
			error,
		});
	}
}

export async function onProviderChange(input: {
	config: NexusAccountConfig;
	providerId: string;
}): Promise<void> {
	if (input.providerId === NEXUS_PASS_PROVIDER_ID) {
		return onChangeToNexusPass(input.config);
	}

	return;
}
