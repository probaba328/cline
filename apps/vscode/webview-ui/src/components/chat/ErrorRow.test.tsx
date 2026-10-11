import type { NexusMessage } from "@shared/ExtensionMessage"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import ErrorRow from "./ErrorRow"

const mockSetUserOrganization = vi.hoisted(() => vi.fn())
const mockUpdateApiConfigurationProto = vi.hoisted(() => vi.fn())
const mockNavigateToSettingsModelPicker = vi.hoisted(() => vi.fn())
const mockApiConfiguration = vi.hoisted(() => ({
	planModeApiProvider: "nexus-pass",
	actModeApiProvider: "nexus-pass",
	planModeNexusPassModelId: "nexus-pass/test-plan-model",
	actModeNexusPassModelId: "nexus-pass/test-act-model",
}))

// Mock the auth context
vi.mock("@/context/NexusAuthContext", () => ({
	useNexusAuth: () => ({
		nexusUser: null,
	}),
	useNexusSignIn: () => ({
		isLoginLoading: false,
	}),
	handleSignOut: vi.fn(),
}))

vi.mock("@/context/ExtensionStateContext", () => ({
	useExtensionState: () => ({
		apiConfiguration: mockApiConfiguration,
		mode: "act",
		providerModelsByProvider: {},
		startProviderModelsRequest: vi.fn(),
		applyProviderModelsResponse: vi.fn(),
		navigateToSettingsModelPicker: mockNavigateToSettingsModelPicker,
	}),
}))

// Mock CreditLimitError component
vi.mock("@/components/chat/CreditLimitError", () => ({
	default: ({ message }: { message: string }) => <div data-testid="credit-limit-error">{message}</div>,
}))

// Mock EntitlementError component
vi.mock("@/components/chat/EntitlementError", () => ({
	default: ({ message }: { message: string }) => <div data-testid="entitlement-error">{message}</div>,
}))

vi.mock("@/services/grpc-client", () => ({
	AccountServiceClient: {
		setUserOrganization: mockSetUserOrganization,
	},
	ModelsServiceClient: {
		updateApiConfigurationProto: mockUpdateApiConfigurationProto,
		commitModelSelection: vi.fn().mockResolvedValue({}),
		resolveProviderModels: vi.fn().mockResolvedValue({ providerId: "nexus", models: {} }),
	},
}))

// Mock NexusError
vi.mock("../../../../src/services/error/NexusError", () => ({
	NexusError: {
		parse: vi.fn(),
	},
	NexusErrorType: {
		Balance: "balance",
		RateLimit: "rateLimit",
		Auth: "auth",
		Entitlement: "entitlement",
		OrgNexusPassRestriction: "orgNexusPassRestriction",
		NexusPassLimit: "nexusPassLimit",
		NexusFreeModelLimit: "nexusFreeModelLimit",
		NexusFreePromotionEnded: "nexusFreePromotionEnded",
		QuotaExceeded: "quotaExceeded",
	},
}))

describe("ErrorRow", () => {
	const mockMessage: NexusMessage = {
		ts: 123456789,
		type: "say",
		say: "error",
		text: "Test error message",
	}

	beforeEach(() => {
		vi.clearAllMocks()
		mockSetUserOrganization.mockResolvedValue({})
		mockUpdateApiConfigurationProto.mockResolvedValue({})
	})

	it("renders basic error message", () => {
		render(<ErrorRow errorType="error" message={mockMessage} />)

		expect(screen.getByText("Test error message")).toBeInTheDocument()
	})

	it("renders mistake limit reached error", () => {
		const mistakeMessage = { ...mockMessage, text: "Mistake limit reached" }
		render(<ErrorRow errorType="mistake_limit_reached" message={mistakeMessage} />)

		expect(screen.getByText("Mistake limit reached")).toBeInTheDocument()
	})

	it("renders diff error", () => {
		render(<ErrorRow errorType="diff_error" message={mockMessage} />)

		expect(
			screen.getByText("The model used search patterns that don't match anything in the file. Retrying..."),
		).toBeInTheDocument()
	})

	it("renders nexusignore error", () => {
		const nexusignoreMessage = { ...mockMessage, text: "/path/to/file.txt" }
		render(<ErrorRow errorType="nexusignore_error" message={nexusignoreMessage} />)

		expect(screen.getByText(/Nexus tried to access/)).toBeInTheDocument()
		expect(screen.getByText("/path/to/file.txt")).toBeInTheDocument()
	})

	describe("API error handling", () => {
		it("renders credit limit error when balance error is detected", async () => {
			const mockNexusError = {
				message: "Insufficient credits",
				isErrorType: vi.fn((type) => type === "balance"),
				_error: {
					details: {
						current_balance: 0,
						total_spent: 10.5,
						total_promotions: 5.0,
						message: "You have run out of credits.",
						buy_credits_url: "https://app.nexus.bot/dashboard",
					},
				},
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiRequestFailedMessage="Insufficient credits error" errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("credit-limit-error")).toBeInTheDocument()
			expect(screen.getByText("You have run out of credits.")).toBeInTheDocument()
		})

		it("does not show Nexus credits CTA for non-Nexus balance errors without a provider URL", async () => {
			const mockNexusError = {
				message: "Not enough credits available",
				providerId: "zai",
				isErrorType: vi.fn((type) => type === "balance"),
				_error: {
					code: "insufficient_credits",
					providerId: "zai",
					details: {
						current_balance: 0,
						message: "Not enough credits available",
					},
				},
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiRequestFailedMessage="Insufficient credits error" errorType="error" message={mockMessage} />)

			expect(screen.queryByTestId("credit-limit-error")).not.toBeInTheDocument()
			expect(screen.getByText(/\[zai\]/)).toBeInTheDocument()
		})

		it("renders rate limit error with request ID", async () => {
			const mockNexusError = {
				message: "Rate limit exceeded",
				isErrorType: vi.fn((type) => type === "rateLimit"),
				_error: {
					request_id: "req_123456",
				},
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiRequestFailedMessage="Rate limit exceeded" errorType="error" message={mockMessage} />)

			expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument()
			expect(screen.getByText("Request ID: req_123456")).toBeInTheDocument()
		})

		it("renders quota exceeded error", async () => {
			const mockNexusError = {
				message: "Inference cap reached",
				isErrorType: vi.fn((type) => type === "quotaexceeded"),
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiRequestFailedMessage="The message" errorType="error" message="" />)
			expect(screen.getByText("Inference cap reached")).toBeInTheDocument()
		})

		it("renders entitlement error when NexusError detects NexusNotSubscribedError", async () => {
			const cliMessage =
				"No access to NexusPass subscription models yet. Subscribe to NexusPass, the low cost open weights model coding plan:"
			const mockNexusError = {
				message: cliMessage,
				isErrorType: vi.fn((type) => type === "entitlement"),
				providerId: "nexus-pass",
				_error: {
					message: cliMessage,
				},
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiRequestFailedMessage={cliMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("entitlement-error")).toBeInTheDocument()
			expect(screen.getByText(cliMessage)).toBeInTheDocument()
			expect(screen.queryByText(/\[nexus-pass\]/i)).not.toBeInTheDocument()
		})

		it("renders entitlement error when NexusError detects a raw required-plan message", async () => {
			const rawMessage = "403 Error 403: the user is not subscribed to required model plan"
			const mockNexusError = {
				message: rawMessage,
				isErrorType: vi.fn((type) => type === "entitlement"),
				providerId: "nexus-pass",
				_error: {
					message: rawMessage,
				},
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiRequestFailedMessage={rawMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("entitlement-error")).toBeInTheDocument()
			expect(screen.getByText(rawMessage)).toBeInTheDocument()
		})

		it("renders organization account NexusPass restriction with friendly account switching copy", async () => {
			const rawMessage = "403 Error 403: organization accounts cannot use individual model inference subscriptions"
			const mockNexusError = {
				message: rawMessage,
				isErrorType: vi.fn((type) => type === "orgNexusPassRestriction"),
				providerId: "nexus",
				_error: {
					message: rawMessage,
				},
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiRequestFailedMessage={rawMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("org-nexus-pass-restriction-error")).toBeInTheDocument()
			expect(screen.getByText(/Organization accounts cannot use NexusPass subscriptions/)).toBeInTheDocument()
			expect(screen.queryByText(rawMessage)).not.toBeInTheDocument()

			fireEvent.click(screen.getByText("Switch to personal account"))

			await waitFor(() => expect(mockSetUserOrganization).toHaveBeenCalledWith({}))
			expect(screen.getByText("Switched to personal account")).toBeInTheDocument()
		})

		it("renders organization NexusPass restriction when NexusError detects the SDK formatted message", async () => {
			const formattedMessage =
				"Organization accounts cannot use NexusPass subscriptions. Go to /account -> change account to switch to your personal account for NexusPass"
			const mockNexusError = {
				message: formattedMessage,
				isErrorType: vi.fn((type) => type === "orgNexusPassRestriction"),
				providerId: "nexus-pass",
				_error: {
					message: formattedMessage,
				},
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiRequestFailedMessage={formattedMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("org-nexus-pass-restriction-error")).toBeInTheDocument()
			expect(screen.queryByText(formattedMessage)).not.toBeInTheDocument()
		})

		it("renders NexusPass limit error and switches to Nexus usage-based billing", async () => {
			const limitMessage = "You have reached your weekly Nexuspass limit. The limit resets in 7d, please try again later."
			const mockNexusError = {
				message: limitMessage,
				isErrorType: vi.fn((type) => type === "nexusPassLimit"),
				providerId: "nexus-pass",
				_error: {
					message: limitMessage,
				},
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiRequestFailedMessage={limitMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("nexus-pass-limit-error")).toBeInTheDocument()
			expect(screen.getByText(limitMessage)).toBeInTheDocument()

			fireEvent.click(screen.getByText("Switch to Usage-Based billing"))

			await waitFor(() => expect(mockUpdateApiConfigurationProto).toHaveBeenCalledTimes(1))
			const request = mockUpdateApiConfigurationProto.mock.calls[0][0]
			expect(request.apiConfiguration.planModeApiProvider).toBe("nexus")
			expect(request.apiConfiguration.actModeApiProvider).toBe("nexus")
			expect(request.apiConfiguration.planModeNexusModelId).toBeUndefined()
			expect(request.apiConfiguration.actModeNexusModelId).toBeUndefined()
			expect(screen.getByText("Switched to Usage-Based billing")).toBeInTheDocument()
		})

		it("renders a daily free model limit without usage-billing guidance", async () => {
			const limitMessage = "Daily free limit reached on model deepseek/deepseek-v4-flash. Try again in 23h 59m"
			const mockNexusError = {
				message: limitMessage,
				isErrorType: vi.fn((type) => type === "nexusFreeModelLimit"),
				providerId: "nexus",
				_error: { message: limitMessage },
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiRequestFailedMessage={limitMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("nexus-free-model-limit-error")).toBeInTheDocument()
			expect(screen.getByText(/You've reached today's free usage limit for this model/)).toBeInTheDocument()
			expect(screen.getByText(/Try again in 23h 59m/)).toBeInTheDocument()
			expect(screen.queryByText(limitMessage)).not.toBeInTheDocument()
			expect(screen.queryByText(/deepseek-v4-flash/i)).not.toBeInTheDocument()
			expect(screen.queryByText(/Switch to Usage-Based billing/i)).not.toBeInTheDocument()
		})

		it("renders the promotion-ended card with a route into the model picker", async () => {
			const rawMessage = "Error 404: Model not found"
			const mockNexusError = {
				message: rawMessage,
				isErrorType: vi.fn((type) => type === "nexusFreePromotionEnded"),
				providerId: "nexus",
				modelId: "nexus-free/glm-5",
				_error: { message: rawMessage },
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiRequestFailedMessage={rawMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("nexus-free-promotion-ended-error")).toBeInTheDocument()
			expect(screen.getByText("Free model promotion ended")).toBeInTheDocument()
			expect(screen.getByText(/no longer available/)).toBeInTheDocument()
			// The raw backend message is replaced by the dedicated copy.
			expect(screen.queryByText(rawMessage)).not.toBeInTheDocument()

			fireEvent.click(screen.getByText("Select a Model"))
			expect(mockNavigateToSettingsModelPicker).toHaveBeenCalledWith({ targetSection: "api-config" })
		})

		it("renders friendly logged-out message and sign in button when user is not signed in", async () => {
			const mockNexusError = {
				message: "Authentication failed",
				isErrorType: vi.fn((type) => type === "auth"),
				providerId: "nexus",
				_error: {},
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiRequestFailedMessage="Authentication failed" errorType="error" message={mockMessage} />)

			expect(screen.queryByText("Authentication failed")).not.toBeInTheDocument()
			expect(screen.getByText(/Whoops looks like you're logged out/)).toBeInTheDocument()
			expect(screen.getByText("Sign in to Nexus")).toBeInTheDocument()
		})

		it("renders PowerShell troubleshooting link when error mentions PowerShell", async () => {
			const mockNexusError = {
				message: "PowerShell is not recognized as an internal or external command",
				isErrorType: vi.fn(() => false),
				_error: {},
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(
				<ErrorRow
					apiRequestFailedMessage="PowerShell is not recognized as an internal or external command"
					errorType="error"
					message={mockMessage}
				/>,
			)

			expect(screen.getByText(/PowerShell is not recognized/)).toBeInTheDocument()
			expect(screen.getByText("troubleshooting guide")).toBeInTheDocument()
			expect(screen.getByRole("link", { name: "troubleshooting guide" })).toHaveAttribute(
				"href",
				"https://github.com/nexus/nexus/wiki/TroubleShooting-%E2%80%90-%22PowerShell-is-not-recognized-as-an-internal-or-external-command%22",
			)
		})

		it("handles apiReqStreamingFailedMessage instead of apiRequestFailedMessage", async () => {
			const mockNexusError = {
				message: "Streaming failed",
				isErrorType: vi.fn(() => false),
				_error: {},
			}

			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(mockNexusError as any)

			render(<ErrorRow apiReqStreamingFailedMessage="Streaming failed" errorType="error" message={mockMessage} />)

			expect(screen.getByText("Streaming failed")).toBeInTheDocument()
		})

		it("falls back to regular error message when NexusError.parse returns null", async () => {
			const { NexusError } = await import("../../../../src/services/error/NexusError")
			vi.mocked(NexusError.parse).mockReturnValue(undefined)

			render(<ErrorRow apiRequestFailedMessage="Some API error" errorType="error" message={mockMessage} />)

			// When NexusError.parse returns null, we display the raw error message for non-Nexus providers
			// Since nexusError is undefined, isNexusUsageBillingProvider is false, so we show the raw apiRequestFailedMessage
			expect(screen.getByText("Some API error")).toBeInTheDocument()
		})

		it("renders regular error message when no API error messages are provided", () => {
			render(<ErrorRow errorType="error" message={mockMessage} />)

			expect(screen.getByText("Test error message")).toBeInTheDocument()
		})
	})
})
