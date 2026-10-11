import type { NexusMessage } from "@shared/ExtensionMessage"
import { memo } from "react"
import { NexusAuthStatus } from "@/components/account/NexusAuthStatus"
import NexusFreeModelLimitError from "@/components/chat/NexusFreeModelLimitError"
import NexusFreePromotionEndedError from "@/components/chat/NexusFreePromotionEndedError"
import NexusPassLimitError from "@/components/chat/NexusPassLimitError"
import CreditLimitError from "@/components/chat/CreditLimitError"
import EntitlementError from "@/components/chat/EntitlementError"
import OrgNexusPassRestrictionError from "@/components/chat/OrgNexusPassRestrictionError"
import SpendLimitError from "@/components/chat/SpendLimitError"
import { Button } from "@/components/ui/button"
import { useNexusAuth, useNexusSignIn } from "@/context/NexusAuthContext"
import { NexusError, NexusErrorType } from "../../../../src/services/error/NexusError"

const _errorColor = "var(--vscode-errorForeground)"

interface ErrorRowProps {
	message: NexusMessage
	errorType: "error" | "mistake_limit_reached" | "diff_error" | "nexusignore_error"
	apiRequestFailedMessage?: string
	apiReqStreamingFailedMessage?: string
}

const ErrorRow = memo(({ message, errorType, apiRequestFailedMessage, apiReqStreamingFailedMessage }: ErrorRowProps) => {
	const { nexusUser } = useNexusAuth()
	const rawApiError = apiRequestFailedMessage || apiReqStreamingFailedMessage

	const { isLoginLoading, authStatusMessage, handleSignIn } = useNexusSignIn()

	const renderErrorContent = () => {
		switch (errorType) {
			case "error":
			case "mistake_limit_reached":
				// Handle API request errors with special error parsing
				if (rawApiError) {
					// FIXME: NexusError parsing should not be applied to non-Nexus providers, but it seems we're using nexusErrorMessage below in the default error display
					const nexusError = NexusError.parse(rawApiError)
					const errorMessage = nexusError?._error?.message || nexusError?.message || rawApiError
					const requestId = nexusError?._error?.request_id
					const providerId = nexusError?.providerId || nexusError?._error?.providerId
					// Deliberately narrower than the shared isNexusManagedProvider (which
					// also matches nexus-pass): only usage-billing errors get the credit
					// and login prompts below.
					const isNexusUsageBillingProvider = providerId === "nexus"
					const errorCode = nexusError?._error?.code

					if (nexusError?.isErrorType(NexusErrorType.Balance)) {
						const errorDetails = nexusError._error?.details
						if (isNexusUsageBillingProvider || errorDetails?.buy_credits_url) {
							return (
								<CreditLimitError
									buyCreditsUrl={errorDetails?.buy_credits_url}
									currentBalance={errorDetails?.current_balance}
									message={errorDetails?.message}
									totalPromotions={errorDetails?.total_promotions}
									totalSpent={errorDetails?.total_spent}
								/>
							)
						}
					}

					if (nexusError?.isErrorType(NexusErrorType.SpendLimit)) {
						const d = nexusError._error?.details
						return (
							<SpendLimitError
								budgetPeriod={d?.budget_period}
								limitUsd={d?.limit_usd}
								message={d?.message || errorMessage}
								resetsAt={d?.resets_at}
								spentUsd={d?.spent_usd}
							/>
						)
					}

					if (nexusError?.isErrorType(NexusErrorType.Entitlement)) {
						const detailMessage = nexusError?._error?.details?.message || errorMessage
						return <EntitlementError message={detailMessage} />
					}

					if (nexusError?.isErrorType(NexusErrorType.OrgNexusPassRestriction)) {
						return <OrgNexusPassRestrictionError />
					}

					if (nexusError?.isErrorType(NexusErrorType.NexusPassLimit)) {
						const detailMessage = nexusError?._error?.details?.message || errorMessage
						return <NexusPassLimitError message={detailMessage} />
					}

					if (nexusError?.isErrorType(NexusErrorType.NexusFreeModelLimit)) {
						const detailMessage = nexusError?._error?.details?.message || errorMessage
						return <NexusFreeModelLimitError message={detailMessage} />
					}

					// A retired free model answers model-not-found once its promotion
					// ends — dedicated copy plus a route into the model picker,
					// since retrying the deleted model can never succeed.
					if (nexusError?.isErrorType(NexusErrorType.NexusFreePromotionEnded)) {
						return <NexusFreePromotionEndedError />
					}

					if (nexusError?.isErrorType(NexusErrorType.RateLimit)) {
						return (
							<p className="m-0 whitespace-pre-wrap text-error wrap-anywhere">
								{errorMessage}
								{requestId && <div>Request ID: {requestId}</div>}
							</p>
						)
					}

					if (nexusError?.isErrorType(NexusErrorType.QuotaExceeded)) {
						const detailMessage = nexusError?._error?.details?.message || errorMessage
						return <p className="m-0 whitespace-pre-wrap text-error wrap-anywhere">{detailMessage}</p>
					}

					if (nexusError?.isErrorType(NexusErrorType.Auth) && isNexusUsageBillingProvider) {
						return !nexusUser ? (
							// User is using Nexus provider and is not logged in
							<div className="flex flex-col gap-3">
								<div className="flex items-center justify-center rounded border border-neutral-500/30 bg-vscode-editor-background p-6 text-center text-vscode-foreground">
									Whoops looks like you're logged out – click below to sign in
								</div>
								<Button className="w-full" disabled={isLoginLoading} onClick={handleSignIn}>
									Sign in to Nexus
									{isLoginLoading && (
										<span className="ml-1 animate-spin">
											<span className="codicon codicon-refresh" />
										</span>
									)}
								</Button>
								<NexusAuthStatus message={authStatusMessage} />
							</div>
						) : (
							// Don't show sign in button after the user has logged in, just ask them to retry
							<div className="mt-4">
								<span className="text-description">(Click "Retry" below)</span>
							</div>
						)
					}

					return (
						<p className="m-0 whitespace-pre-wrap text-error wrap-anywhere flex flex-col gap-3">
							{/* Display the well-formatted error extracted from the NexusError instance */}

							<header>
								{providerId && <span className="uppercase">[{providerId}] </span>}
								{errorCode && <span>{errorCode}</span>}
								{errorMessage}
								{requestId && <div>Request ID: {requestId}</div>}
							</header>

							{/* Windows Powershell Issue */}
							{errorMessage?.toLowerCase()?.includes("powershell") && (
								<div>
									It seems like you're having Windows PowerShell issues, please see this{" "}
									<a
										className="underline text-inherit"
										href="https://github.com/nexus/nexus/wiki/TroubleShooting-%E2%80%90-%22PowerShell-is-not-recognized-as-an-internal-or-external-command%22">
										troubleshooting guide
									</a>
									.
								</div>
							)}

							{/* Display raw API error if different from parsed error message */}
							{errorMessage !== rawApiError && <div>{rawApiError}</div>}
						</p>
					)
				}

				// Regular error message
				return <p className="m-0 mt-0 whitespace-pre-wrap text-error wrap-anywhere">{message.text}</p>

			case "diff_error":
				return (
					<div className="flex flex-col p-2 rounded text-xs opacity-80 bg-quote text-foreground">
						<div>The model used search patterns that don't match anything in the file. Retrying...</div>
					</div>
				)

			case "nexusignore_error":
				return (
					<div className="flex flex-col p-2 rounded text-xs opacity-80 bg-quote text-foreground">
						<div>
							Nexus tried to access <code>{message.text}</code> which is blocked by the <code>.nexusignore</code>
							file.
						</div>
					</div>
				)

			default:
				return null
		}
	}

	// For diff_error and nexusignore_error, we don't show the header separately
	if (errorType === "diff_error" || errorType === "nexusignore_error") {
		return renderErrorContent()
	}

	// For other error types, show header + content
	return renderErrorContent()
})

export default ErrorRow
