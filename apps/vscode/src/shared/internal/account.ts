/**
 * List of email domains that are considered trusted testers for Nexus.
 */
const NEXUS_TRUSTED_TESTER_DOMAINS = ["fibilabs.tech"]

/**
 * Checks if the given email belongs to a Nexus bot user.
 * E.g. Emails ending with @nexus.bot
 */
function isNexusBotUser(email: string): boolean {
	return email.endsWith("@nexus.bot")
}

export function isNexusInternalTester(email: string): boolean {
	return isNexusBotUser(email) || NEXUS_TRUSTED_TESTER_DOMAINS.some((d) => email.endsWith(`@${d}`))
}
