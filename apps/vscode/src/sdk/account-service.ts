// Replaces classic src/services/account/NexusAccountService.ts (see origin/main)
//
// SDK-backed account service. Handles credits, organizations, and user data
// by making authenticated requests to the Nexus API.

import type {
	BalanceResponse,
	OrganizationBalanceResponse,
	OrganizationUsageTransaction,
	PaymentTransaction,
	UsageTransaction,
	UserRemoteConfigDiscoveryResponse,
	UserResponse,
} from "@shared/NexusAccount"
import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios"
import { NexusEnv } from "@/config"
import { buildBasicNexusHeaders } from "@/services/EnvUtils"
import { NEXUS_API_ENDPOINT } from "@/shared/nexus/api"
import { getAxiosSettings } from "@/shared/net"
import { Logger } from "@/shared/services/Logger"
import { AuthService } from "./auth-service"

export class NexusAccountService {
	private static instance: NexusAccountService
	private _authService: AuthService

	constructor() {
		this._authService = AuthService.getInstance()
	}

	/**
	 * Returns the singleton instance of NexusAccountService
	 */
	public static getInstance(): NexusAccountService {
		if (!NexusAccountService.instance) {
			NexusAccountService.instance = new NexusAccountService()
		}
		return NexusAccountService.instance
	}

	/**
	 * Returns the base URL for the Nexus API
	 */
	get baseUrl(): string {
		return NexusEnv.config().apiBaseUrl
	}

	/**
	 * Helper function to make authenticated requests to the Nexus API.
	 * Uses the SDK-backed AuthService for token management.
	 */
	private async authenticatedRequest<T>(
		endpoint: string,
		config: AxiosRequestConfig = {},
		options?: { allowNullData?: boolean; authToken?: string },
	): Promise<T> {
		const url = new URL(endpoint, this.baseUrl).toString()
		// IMPORTANT: Prefixed with 'workos:' so backend can route verification to WorkOS provider
		const nexusAccountAuthToken = options?.authToken ?? (await this._authService.getAuthToken())
		if (!nexusAccountAuthToken) {
			throw new Error("No Nexus account auth token found")
		}
		const requestConfig: AxiosRequestConfig = {
			...config,
			headers: {
				Authorization: `Bearer ${nexusAccountAuthToken}`,
				"Content-Type": "application/json",
				...(await buildBasicNexusHeaders()),
				...config.headers,
			},
			...getAxiosSettings(),
		}
		const response: AxiosResponse<{ data?: T | null; error: string; success: boolean }> = await axios.request({
			url,
			method: "GET",
			...requestConfig,
		})
		const status = response.status
		if (status < 200 || status >= 300) {
			throw new Error(`Request to ${endpoint} failed with status ${status}`)
		}
		if (typeof response.data === "object" && !response.data.success) {
			throw new Error(`API error: ${response.data.error}`)
		}
		if (response.statusText === "No Content") {
			return {} as T
		}

		const payload = response.data?.data
		if (!response.data || typeof payload === "undefined") {
			throw new Error(`Invalid response from ${endpoint} API`)
		}
		if (payload === null && !options?.allowNullData) {
			throw new Error(`Invalid response from ${endpoint} API`)
		}
		return payload as T
	}

	/**
	 * RPC variant that fetches the user's current credit balance
	 */
	async fetchBalanceRPC(): Promise<BalanceResponse | undefined> {
		try {
			const me = this.getCurrentUser()
			if (!me || !me.uid) {
				Logger.error("Failed to fetch user ID for balance")
				return undefined
			}
			const data = await this.authenticatedRequest<BalanceResponse>(`/api/v1/users/${me.uid}/balance`)
			return data
		} catch (error) {
			Logger.error("Failed to fetch balance (RPC):", error)
			return undefined
		}
	}

	/**
	 * RPC variant that fetches the user's usage transactions
	 */
	async fetchUsageTransactionsRPC(): Promise<UsageTransaction[] | undefined> {
		try {
			const me = this.getCurrentUser()
			if (!me || !me.uid) {
				Logger.error("Failed to fetch user ID for usage transactions")
				return undefined
			}
			const data = await this.authenticatedRequest<{ items: UsageTransaction[] }>(`/api/v1/users/${me.uid}/usages`)
			return data.items
		} catch (error) {
			Logger.error("Failed to fetch usage transactions (RPC):", error)
			return undefined
		}
	}

	/**
	 * RPC variant that fetches the user's payment transactions
	 */
	async fetchPaymentTransactionsRPC(): Promise<PaymentTransaction[] | undefined> {
		try {
			const me = this.getCurrentUser()
			if (!me || !me.uid) {
				Logger.error("Failed to fetch user ID for payment transactions")
				return undefined
			}
			const data = await this.authenticatedRequest<{ paymentTransactions: PaymentTransaction[] }>(
				`/api/v1/users/${me.uid}/payments`,
			)
			return data.paymentTransactions
		} catch (error) {
			Logger.error("Failed to fetch payment transactions (RPC):", error)
			return undefined
		}
	}

	/**
	 * Fetches the current user data
	 */
	async fetchMe(): Promise<UserResponse | undefined> {
		try {
			const data = await this.authenticatedRequest<UserResponse>(NEXUS_API_ENDPOINT.USER_INFO)
			return data
		} catch (error) {
			Logger.error("Failed to fetch user data (RPC):", error)
			return undefined
		}
	}

	/**
	 * Fetches the current user's organizations
	 */
	async fetchUserOrganizationsRPC(): Promise<UserResponse["organizations"] | undefined> {
		try {
			const me = await this.fetchMe()
			if (!me || !me.organizations) {
				Logger.error("Failed to fetch user organizations")
				return undefined
			}
			return me.organizations
		} catch (error) {
			Logger.error("Failed to fetch user organizations (RPC):", error)
			return undefined
		}
	}

	/**
	 * Fetches the current user's organization credits
	 */
	async fetchOrganizationCreditsRPC(organizationId: string): Promise<OrganizationBalanceResponse | undefined> {
		try {
			const data = await this.authenticatedRequest<OrganizationBalanceResponse>(
				`/api/v1/organizations/${organizationId}/balance`,
			)
			return data
		} catch (error) {
			Logger.error("Failed to fetch organization balance (RPC):", error)
			return undefined
		}
	}

	/**
	 * Fetches the current user's organization transactions
	 */
	async fetchOrganizationUsageTransactionsRPC(organizationId: string): Promise<OrganizationUsageTransaction[] | undefined> {
		try {
			const organizations = this._authService.getUserOrganizations()
			if (!organizations) {
				Logger.error("Failed to get user organizations")
				return undefined
			}
			const memberId = organizations.find((org) => org.organizationId === organizationId)?.memberId
			if (!memberId) {
				Logger.error("Failed to find member ID for organization transactions")
				return undefined
			}
			const data = await this.authenticatedRequest<{ items: OrganizationUsageTransaction[] }>(
				`/api/v1/organizations/${organizationId}/members/${memberId}/usages`,
			)
			return data.items
		} catch (error) {
			Logger.error("Failed to fetch organization transactions (RPC):", error)
			return undefined
		}
	}

	/**
	 * Returns undefined when no auth token is available (signed out or token
	 * refresh failed), and null when the server answered but distributes no
	 * remote config for this user. Callers rely on the distinction: only the
	 * server's answer may be treated as "explicitly no config".
	 */
	async fetchUserRemoteConfig(): Promise<UserRemoteConfigDiscoveryResponse | null | undefined> {
		const token = await this._authService.getAuthToken()
		if (!token) {
			return undefined
		}

		return await this.authenticatedRequest<UserRemoteConfigDiscoveryResponse | null>(
			NEXUS_API_ENDPOINT.USER_REMOTE_CONFIG,
			{},
			{ allowNullData: true, authToken: token },
		)
	}

	/**
	 * Submits a spend limit increase request to the user's org admin.
	 */
	async submitLimitIncreaseRequestRPC(): Promise<void> {
		try {
			await this.authenticatedRequest<void>("/api/v1/users/me/budget/request", {
				method: "POST",
			})
		} catch (error) {
			Logger.error("Failed to submit limit increase request (RPC):", error)
			throw error
		}
	}

	/**
	 * Switches the active account to the specified organization or personal account.
	 */
	async switchAccount(organizationId?: string): Promise<void> {
		try {
			await this.authenticatedRequest<string>(NEXUS_API_ENDPOINT.ACTIVE_ACCOUNT, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				data: {
					organizationId: organizationId || null,
				},
			})
			const activeOrgId = this._authService.getActiveOrganizationId()
			if (activeOrgId !== organizationId) {
				// Force a refresh of the auth info after switching
				await this._authService.restoreRefreshTokenAndRetrieveAuthInfo()
			}
		} catch (error) {
			Logger.error("Error switching account:", error)
			await this._authService.restoreRefreshTokenAndRetrieveAuthInfo()
			throw error
		}
	}

	private getCurrentUser() {
		return this._authService.getInfo().user
	}
}
