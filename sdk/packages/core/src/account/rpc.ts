import type {
	NexusAccountActionRequest,
	ProviderActionRequest,
} from "@nexus/shared";
import type {
	NexusAccountBalance,
	NexusAccountOrganization,
	NexusAccountOrganizationBalance,
	NexusAccountOrganizationUsageTransaction,
	NexusAccountPaymentTransaction,
	NexusAccountUsageTransaction,
	NexusAccountUser,
	FeaturebaseTokenResponse,
} from "./types";

export interface NexusAccountOperations {
	fetchMe(): Promise<NexusAccountUser>;
	fetchBalance(userId?: string): Promise<NexusAccountBalance>;
	fetchUsageTransactions(
		userId?: string,
	): Promise<NexusAccountUsageTransaction[]>;
	fetchPaymentTransactions(
		userId?: string,
	): Promise<NexusAccountPaymentTransaction[]>;
	fetchUserOrganizations(): Promise<NexusAccountOrganization[]>;
	fetchOrganizationBalance(
		organizationId: string,
	): Promise<NexusAccountOrganizationBalance>;
	fetchOrganizationUsageTransactions(input: {
		organizationId: string;
		memberId?: string;
	}): Promise<NexusAccountOrganizationUsageTransaction[]>;
	switchAccount(organizationId?: string | null): Promise<void>;
	fetchFeaturebaseToken?(): Promise<FeaturebaseTokenResponse | undefined>;
}

export function isNexusAccountActionRequest(
	request: ProviderActionRequest,
): request is NexusAccountActionRequest {
	return request.action === "nexusAccount";
}

export async function executeNexusAccountAction(
	request: NexusAccountActionRequest,
	service: NexusAccountOperations,
): Promise<unknown> {
	switch (request.operation) {
		case "fetchMe":
			return service.fetchMe();
		case "fetchBalance":
			return service.fetchBalance(request.userId);
		case "fetchUsageTransactions":
			return service.fetchUsageTransactions(request.userId);
		case "fetchPaymentTransactions":
			return service.fetchPaymentTransactions(request.userId);
		case "fetchUserOrganizations":
			return service.fetchUserOrganizations();
		case "fetchOrganizationBalance":
			return service.fetchOrganizationBalance(request.organizationId);
		case "fetchOrganizationUsageTransactions":
			return service.fetchOrganizationUsageTransactions({
				organizationId: request.organizationId,
				memberId: request.memberId,
			});
		case "switchAccount":
			await service.switchAccount(request.organizationId);
			return { updated: true };
		case "fetchFeaturebaseToken":
			return service.fetchFeaturebaseToken?.();
		default: {
			const exhaustive: never = request;
			throw new Error(
				`Unsupported Nexus account operation: ${String(exhaustive)}`,
			);
		}
	}
}

export interface ProviderActionExecutor {
	runProviderAction(request: ProviderActionRequest): Promise<{
		result: unknown;
	}>;
}

export class RpcNexusAccountService implements NexusAccountOperations {
	private readonly executor: ProviderActionExecutor;

	constructor(executor: ProviderActionExecutor) {
		this.executor = executor;
	}

	public async fetchMe(): Promise<NexusAccountUser> {
		return this.request<NexusAccountUser>({
			action: "nexusAccount",
			operation: "fetchMe",
		});
	}

	public async fetchBalance(userId?: string): Promise<NexusAccountBalance> {
		return this.request<NexusAccountBalance>({
			action: "nexusAccount",
			operation: "fetchBalance",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchUsageTransactions(
		userId?: string,
	): Promise<NexusAccountUsageTransaction[]> {
		return this.request<NexusAccountUsageTransaction[]>({
			action: "nexusAccount",
			operation: "fetchUsageTransactions",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchPaymentTransactions(
		userId?: string,
	): Promise<NexusAccountPaymentTransaction[]> {
		return this.request<NexusAccountPaymentTransaction[]>({
			action: "nexusAccount",
			operation: "fetchPaymentTransactions",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchUserOrganizations(): Promise<NexusAccountOrganization[]> {
		return this.request<NexusAccountOrganization[]>({
			action: "nexusAccount",
			operation: "fetchUserOrganizations",
		});
	}

	public async fetchOrganizationBalance(
		organizationId: string,
	): Promise<NexusAccountOrganizationBalance> {
		const orgId = organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<NexusAccountOrganizationBalance>({
			action: "nexusAccount",
			operation: "fetchOrganizationBalance",
			organizationId: orgId,
		});
	}

	public async fetchOrganizationUsageTransactions(input: {
		organizationId: string;
		memberId?: string;
	}): Promise<NexusAccountOrganizationUsageTransaction[]> {
		const orgId = input.organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<NexusAccountOrganizationUsageTransaction[]>({
			action: "nexusAccount",
			operation: "fetchOrganizationUsageTransactions",
			organizationId: orgId,
			...(input.memberId?.trim() ? { memberId: input.memberId.trim() } : {}),
		});
	}

	public async switchAccount(organizationId?: string | null): Promise<void> {
		await this.request<{ updated: boolean }>({
			action: "nexusAccount",
			operation: "switchAccount",
			organizationId: organizationId?.trim() || null,
		});
	}

	public async fetchFeaturebaseToken(): Promise<
		FeaturebaseTokenResponse | undefined
	> {
		return this.request<FeaturebaseTokenResponse | undefined>({
			action: "nexusAccount",
			operation: "fetchFeaturebaseToken",
		});
	}

	private async request<T>(request: NexusAccountActionRequest): Promise<T> {
		const response = await this.executor.runProviderAction(request);
		return response.result as T;
	}
}
