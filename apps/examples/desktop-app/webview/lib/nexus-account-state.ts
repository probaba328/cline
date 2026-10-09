// Shared between the sidecar (which produces this result) and the webview
// (which consumes it), like the desktop transport types.

/**
 * Typed result the `nexus_account` sidecar command returns when no Nexus
 * account credentials exist. Being signed out is an expected state, so it
 * travels as a structured response instead of a thrown error: it must not be
 * reported to error telemetry or rendered as a raw error string.
 */
export const NEXUS_ACCOUNT_NOT_AUTHENTICATED_CODE =
	"ACCOUNT_NOT_AUTHENTICATED" as const;

export type NexusAccountNotAuthenticatedResult = {
	signedIn: false;
	code: typeof NEXUS_ACCOUNT_NOT_AUTHENTICATED_CODE;
};

export const NEXUS_ACCOUNT_NOT_AUTHENTICATED_RESULT: NexusAccountNotAuthenticatedResult =
	{
		signedIn: false,
		code: NEXUS_ACCOUNT_NOT_AUTHENTICATED_CODE,
	};

export function isNexusAccountNotAuthenticatedResult(
	value: unknown,
): value is NexusAccountNotAuthenticatedResult {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as NexusAccountNotAuthenticatedResult).code ===
			NEXUS_ACCOUNT_NOT_AUTHENTICATED_CODE &&
		(value as NexusAccountNotAuthenticatedResult).signedIn === false
	);
}
